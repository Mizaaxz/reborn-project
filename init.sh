chmod +x start.sh
cp -r /root/server/mmrb.service /etc/systemd/system
systemctl start mmrb
systemctl enable mmrb
echo "Enabled mmrb service."