import torch.nn as nn
import timm

class MultiTaskSwinV2(nn.Module):
    def __init__(self, model_name='swinv2_small_window16_256', pretrained=False, num_classes=4):
        super(MultiTaskSwinV2, self).__init__()
        # num_classes=0으로 설정하여 classifier를 제외한 특징 추출기(backbone)만 생성
        self.backbone = timm.create_model(model_name, pretrained=pretrained, num_classes=0)
        num_features = self.backbone.num_features

        # 1. AI 생성 여부 및 등급 분류 Head
        self.head_label = nn.Sequential(
            nn.Linear(num_features, 512), 
            nn.ReLU(), 
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        # 2. SSIM 수치 예측 Head
        self.head_ssim = nn.Sequential(
            nn.Linear(num_features, 256), 
            nn.ReLU(), 
            nn.Linear(256, 1)
        )
        # 3. LPIPS 수치 예측 Head
        self.head_lpips = nn.Sequential(
            nn.Linear(num_features, 256), 
            nn.ReLU(), 
            nn.Linear(256, 1)
        )

    def forward(self, x):
        features = self.backbone(x)
        return {
            "logits": self.head_label(features),
            "ssim": self.head_ssim(features),
            "lpips": self.head_lpips(features),
        }