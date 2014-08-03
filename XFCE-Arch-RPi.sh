echo "Run this script as root only."
echo "You can hit Ctrl+c in next 10 seconds if you don't want to continue."
// mv .config ~/.config
// mv sources.list /etc/apt/sources.list
wget -qO- https://toolbelt.heroku.com/install-ubuntu.sh | sh
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
apt-get update
sudo apt-get install -y -f google-chrome 
sudo apt-get install -y -f redshift 
sudo apt-get install -y -f deluge
sudo apt-get install -y -f sqlite3
sudo apt-get install -y -f  php-sqlite
sudo apt-get install -y -f apache2 
sudo apt-get install -y --ignore-missing php5 nautilus-dropbox
sudo apt-get install -y -f caffeine
sudo apt-get install -y -f cups
sudo apt-get install -y -f firefox
sudo apt-get install -y -f nautilus
sudo apt-get install -y -f nautilus-dropbox
sudo apt-get install -y -f mysql-server-core-5.5
sudo apt-get install -y -f mysql-client-5.5 
sudo apt-get install -y -f nodejs-dev 
sudo apt-get install -y -f nodejs rails sublime-text
sudo apt-get install -y -f google-chrome-stable



    
