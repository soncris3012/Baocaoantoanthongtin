#!/usr/bin/env bash
# ==============================================================================
# Script Cai dat Tu dong Moi truong Lab DVWA cho 3 May ao Ubuntu (Lap Win 1, 2, 3)
# Bai tap lon: An toan Thong tin - Kiem thu & Kiem toan He thong Web (DVWA)
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}=== [1/4] Cap nhat he thong & cai dat Docker, cURL, grep, SQLMap ===${NC}"
sudo apt update
sudo apt install -y docker.io curl grep sqlmap

echo -e "${CYAN}=== [2/4] Khoi dong Docker service & cap quyen user hien tai ===${NC}"
sudo systemctl enable --now docker || true
sudo usermod -aG docker "$USER" || true

echo -e "${CYAN}=== [3/4] Keo image vulnerables/web-dvwa & khoi chay container 'dvwa' ===${NC}"
if sudo docker ps -a --format '{{.Names}}' | grep -q '^dvwa$'; then
  echo -e "${YELLOW}[!] Container 'dvwa' da ton tai. Dang khoi dong lai...${NC}"
  sudo docker start dvwa
else
  sudo docker run --name dvwa -d -p 8080:80 vulnerables/web-dvwa
fi

echo -e "${CYAN}=== [4/4] Kiem tra trang thai container va cong 8080 ===${NC}"
sleep 3
sudo docker ps --filter "name=dvwa"
curl -I -s http://127.0.0.1:8080/login.php | head -n 5 || true

echo ""
echo -e "${GREEN}===================================================================${NC}"
echo -e "${GREEN}HOAN TAT CAI DAT LAB DVWA TREN UBUNTU VM!${NC}"
echo -e "${GREEN}===================================================================${NC}"
echo "Cac buoc tiep theo ban can lam tren trinh duyet:"
echo "  1. Mo trinh duyet truy cap: http://127.0.0.1:8080/setup.php"
echo "  2. Bam nut 'Create / Reset Database'"
echo "  3. Dang nhap voi tai khoan: admin | mat khau: password"
echo "  4. Chay lenh 'newgrp docker' (hoac dang nhap lai terminal) de go docker khong can sudo."
echo ""
echo "Meo dong bo voi may Mac:"
echo "  - Thay ma container '215d3a734374' trong bao cao bang ten 'dvwa'"
echo "  - Vi du: docker exec -it dvwa mysql -u root -e \"USE dvwa; SELECT user_id, user, password FROM users;\""
