echo "Run this script as root only."
echo "You can hit Ctrl+c in next 10 seconds if you don't want to continue."
sleep 10
# adduser nonroot
mv .confid ~/.config
mv sources.list /etc/apt/sources.list

apt-get update
apt-get -y  chromium-browser
apt-get -y  apache2 php5 android-tools-adb	caffeine cups firefox nautilus mysql-server-core-5.5
apt-get -y  mysql-client-5.5 nodejs-dev nodejs	php5-sqlite rails sublime-text

chmod 777 /home/nonroot/.xinitrc

curl https://raw.github.com/jalvani/arch-desktop-environments/master/xinitrc >> ~/.xinitrc
curl https://raw.github.com/jalvani/arch-desktop-environments/master/bash_profile >> ~/.bash_profile

reboot
