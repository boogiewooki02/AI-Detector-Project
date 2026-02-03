import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
import os
from PIL import Image
from torchvision import transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
from model_def import MultiTaskSwinV2

class SwinInference:
    def __init__(self, model_path, model_name, upload_dir):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.img_size = 256
        self.upload_dir = upload_dir
        
        # 모델 초기화 및 가중치 로드
        self.model = MultiTaskSwinV2(model_name=model_name, num_classes=4)
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        state_dict = checkpoint['model_state_dict'] if 'model_state_dict' in checkpoint else checkpoint
        new_state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
        self.model.load_state_dict(new_state_dict, strict=False)
        self.model.to(self.device).eval()

        self.stats = checkpoint.get('stats', None)

        # 전처리 정의
        self.transform = transforms.Compose([
            transforms.Resize((self.img_size, self.img_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def reshape_transform(self, tensor):
        # Swin Transformer 레이어 출력을 CAM용 2D로 변환 [B, H, W, C] -> [B, C, H, W]
        result = tensor.permute(0, 3, 1, 2)
        return result

    def _calc_rm_pvr(self, pil_image, k=3.0):
        img_rgb = np.array(pil_image.convert("RGB"))
        img_gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
        filter_kernel = np.array([[0, -1, 2, -1, 0], [0, 2, -4, 2, 0], [0, -1, 2, -1, 0]], dtype=np.float32) / 4.0
        res_map = cv2.filter2D(img_gray, -1, filter_kernel)
        abs_res = np.abs(res_map)
        rm = float(np.mean(abs_res))
        std_res = float(np.std(abs_res))
        threshold = k * std_res
        size = abs_res.size if abs_res.size > 0 else 1
        pvr = float((np.sum(abs_res > threshold) / size) * 100.0)
        return rm, pvr

    def predict(self, pil_image, original_filename):
        # 1. 전처리
        image_rgb = pil_image.convert('RGB')
        vis_image = image_rgb.resize((self.img_size, self.img_size))
        rgb_img_float = np.array(vis_image, dtype=np.float32) / 255.0
        input_tensor = self.transform(image_rgb).unsqueeze(0).to(self.device)

        # 2. Grad-CAM용 Wrapper
        class CAMWrapper(nn.Module):
            def __init__(self, model):
                super().__init__()
                self.model = model
            def forward(self, x):
                return self.model(x)['logits']

        # 3. Grad-CAM 설정 및 생성
        target_layers = [self.model.backbone.layers[-1].blocks[-1].norm1]
        cam = GradCAM(model=CAMWrapper(self.model), target_layers=target_layers, reshape_transform=self.reshape_transform)
        
        with torch.no_grad():
            outputs = self.model(input_tensor)
        
        logits = outputs['logits']
        pred_idx = torch.argmax(logits, dim=1).item()
        confidence = F.softmax(logits, dim=1)[0][pred_idx].item()
        
        # 4. 역정규화 및 지표 추출
        ssim_val, lpips_val = outputs['ssim'].item(), outputs['lpips'].item()
        if self.stats:
            ssim_val = max(0.0, min(1.0, (ssim_val * self.stats['ssim_std']) + self.stats['ssim_mean']))
            lpips_val = max(0.0, (lpips_val * self.stats['lpips_std']) + self.stats['lpips_mean'])

        # 5. 히트맵 이미지 저장
        targets = [ClassifierOutputTarget(pred_idx)]
        grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0, :]
        visualization = show_cam_on_image(rgb_img_float, grayscale_cam, use_rgb=True)
        
        heatmap_filename = f"hm_{original_filename}"
        heatmap_path = os.path.join(self.upload_dir, heatmap_filename)
        cv2.imwrite(heatmap_path, cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR))

        # 6. RM/PVR 계산
        rm, pvr = self._calc_rm_pvr(pil_image)

        return {
            "label": pred_idx,
            "confidence": confidence,
            "ssim": ssim_val,
            "lpips": lpips_val,
            "rm": rm,
            "pvr": pvr,
            "heatmap_filename": heatmap_filename
        }