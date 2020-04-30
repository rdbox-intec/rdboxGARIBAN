# RDBOX GARIBAN

forked from [balena\-io/etcher](https://github.com/balena-io/etcher)
The major design pattern of this software was abstracted from balena-io's etcher, which is subject to the same license.

<img src="./docs/images/GARIBAN_PV_Short.gif" width=540px></img>

You can create an RDBOX's SD card easily by app. (Now offering Windows10 version. Mac and Linux versions will be released soon.)

:arrow_down: [Download Windows10](https://github.com/rdbox-intec/rdboxGARIBAN/releases/download/v0.1.6/rdboxGARIBAN-Setup-0.1.6.exe) | :arrow_down: [Download MacOS](https://github.com/rdbox-intec/rdboxGARIBAN/releases/download/v0.1.6/rdboxGARIBAN-0.1.6.dmg) | :arrow_down: [Download Linux](https://github.com/rdbox-intec/rdboxGARIBAN/releases/download/v0.1.6/rdbox-gariban-electron_0.1.6_amd64.deb)

## What's RDBOX Prj??
<img src="https://github.com/rdbox-intec/rdbox/raw/master/images/you_can_easily_make_by_rdbox.png" width=720px></img>

[GitHub: rdbox\-intec/rdbox](https://github.com/rdbox-intec/rdbox)  
RDBOX is a IT infrastructure for ROS robots. These is very smart like your ROS robot.
Don’t be surprised, there IT infrastructure is **built automatically** and **maintained automatically**.  
And that is got Effect with only **Run the scripts** and **Burn the SDCARD.** 

**Make Robotics / IoT Engineers' Work a Lot Easier.**

## Install
### Ubuntu(18.04 Bionic)
1. Register the RDBOX Deb repository.
```bash
echo "deb https://dl.bintray.com/rdbox/deb buster main" | sudo tee /etc/apt/sources.list.d/rdbox.list
```

2. Install GPG Key
```bash
curl -s https://bintray.com/user/downloadSubjectPublicKey?username=rdbox | sudo apt-key add -
```

3. Update && Install
```bash
sudo apt-get update
sudo apt-get install rdbox-gariban-electron
```
