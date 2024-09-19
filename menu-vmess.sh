#!/bin/bash

NC='\033[0;37m' 
PURPLE='\033[0;34m' 
GREEN='\033[0;32m' 
RED='\033[0;31m'
BIWhite='\033[1;97m'  
red() { echo -e "\\033[31;1m${*}\\033[0m"; }

clear
clear
function add-ws(){
clear
source /var/lib/scrz-prem/ipvps.conf
if [[ "$IP" = "" ]]; then
domain=$(cat /etc/xray/domain)
else
domain=$IP
fi

#tls="$(cat ~/log-install.txt | grep -w "Vmess TLS" | cut -d: -f2|sed 's/ //g')"
#none="$(cat ~/log-install.txt | grep -w "Vmess None TLS" | cut -d: -f2|sed 's/ //g')"
until [[ $user =~ ^[a-zA-Z0-9_]+$ && ${CLIENT_EXISTS} == '0' ]]; do
echo -e "\033[0;34m┌─────────────────────────────────────────────────┐\033[0m"
echo -e "\033[0;34m│\E[42;1;37m           Create Xray/Vmess Account            \033[0;34m│"
echo -e "\033[0;34m└─────────────────────────────────────────────────┘\033[0m"

		read -rp "User: " -e user
		CLIENT_EXISTS=$(grep -w $user /etc/xray/config.json | wc -l)

		if [[ ${CLIENT_EXISTS} == '1' ]]; then
clear
            echo -e "\033[0;34m┌─────────────────────────────────────────────────┐\033[0m"
            echo -e "\033[0;34m│\E[42;1;37m           Create Xray/Vmess Account            \033[0;34m│"
            echo -e "\033[0;34m└─────────────────────────────────────────────────┘\033[0m"
			echo ""
			echo "A client with the specified name was already created, please choose another name."
			echo ""
			echo -e "\033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
			read -n 1 -s -r -p "Press any key to back on menu"
menu
		fi
	done

uuid=$(cat /proc/sys/kernel/random/uuid)
read -p "Expired (days): " masaaktif
exp=`date -d "$masaaktif days" +"%Y-%m-%d"`
sed -i '/#vmess$/a\### '"$user $exp"'\
},{"id": "'""$uuid""'","alterId": '"0"',"email": "'""$user""'"' /etc/xray/config.json
sed -i '/#vmessgrpc$/a\### '"$user $exp"'\
},{"id": "'""$uuid""'","alterId": '"0"',"email": "'""$user""'"' /etc/xray/config.json
asu=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "bug.com",
      "port": "443",
      "id": "${uuid}",
      "aid": "0",
      "net": "ws",
      "path": "/vmess",
      "type": "none",
      "host": "${domain}",
      "tls": "tls"
}
EOF`
ask=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "bug.com",
      "port": "80",
      "id": "${uuid}",
      "aid": "0",
      "net": "ws",
      "path": "/vmess",
      "type": "none",
      "host": "${domain}",
      "tls": "none"
}
EOF`
grpc=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "${domain}",
      "port": "443",
      "id": "${uuid}",
      "aid": "0",
      "net": "grpc",
      "path": "vmess-grpc",
      "type": "none",
      "host": "bug.com",
      "tls": "tls"
}
EOF`
vmess_base641=$( base64 -w 0 <<< $vmess_json1)
vmess_base642=$( base64 -w 0 <<< $vmess_json2)
vmess_base643=$( base64 -w 0 <<< $vmess_json3)
vmesslink1="vmess://$(echo $asu | base64 -w 0)"
vmesslink2="vmess://$(echo $ask | base64 -w 0)"
vmesslink3="vmess://$(echo $grpc | base64 -w 0)"

systemctl restart xray > /dev/null 2>&1
service cron restart > /dev/null 2>&1

clear
echo -e "\033[0;34m═══════════\033[0;33mXRAY/VMESS\033[0;34m═══════════${NC}"
echo -e "\033[0;34m════════════════════════════════${NC}"
echo -e "Remarks       : ${user}"
echo -e "Expired On    : $exp" 
echo -e "Domain        : ${domain}" 
echo -e "Port TLS      : 443, 8443, 2096, 2087" 
echo -e "Port none TLS : 80, 8080, 8880, 2082" 
echo -e "Port  GRPC    : 443, 8443, 2096, 2087" 
echo -e "id            : ${uuid}" 
echo -e "alterId       : 0" 
echo -e "Security      : auto" 
echo -e "Network       : ws" 
echo -e "Path          : /vmess" 
#echo -e "Path          : /worryfree" 
#echo -e "Path          : http://bug/worryfree" 
#echo -e "Path          : /kuota-habis" 
echo -e "ServiceName   : vmess-grpc" 
echo -e "\033[0;34m════════════════════════════════${NC}" 
echo -e "Link TLS : "
echo -e "${vmesslink1}" 
echo -e "\033[0;34m════════════════════════════════${NC} "
echo -e "Link none TLS : "
echo -e "${vmesslink2}" 
echo -e "\033[0;34m════════════════════════════════${NC} "
echo -e "Link GRPC : "
echo -e "${vmesslink3}"
echo -e "\033[0;34m════════════════════════════════${NC}" 
echo -e "\033[0;32m Sc By Arya Blitar ${NC}" 
echo "" | tee -a /etc/log-create-user.log
rm /etc/xray/$user-tls.json > /dev/null 2>&1
rm /etc/xray/$user-none.json > /dev/null 2>&1
read -n 1 -s -r -p "Press any key to back on menu"
    
    menu-vmess
    
}
function trialvmess(){
domain=$(cat /etc/xray/domain)
user=trial`</dev/urandom tr -dc X-Z0-9 | head -c4`
uuid=$(cat /proc/sys/kernel/random/uuid)
masaaktif=1
exp=`date -d "$masaaktif days" +"%Y-%m-%d"`
sed -i '/#vmess$/a\### '"$user $exp"'\
},{"id": "'""$uuid""'","alterId": '"0"',"email": "'""$user""'"' /etc/xray/config.json
exp=`date -d "$masaaktif days" +"%Y-%m-%d"`
sed -i '/#vmessgrpc$/a\### '"$user $exp"'\
},{"id": "'""$uuid""'","alterId": '"0"',"email": "'""$user""'"' /etc/xray/config.json
asu=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "bug.com",
      "port": "443",
      "id": "${uuid}",
      "aid": "0",
      "net": "ws",
      "path": "/vmess",
      "type": "none",
      "host": "${domain}",
      "tls": "tls"
}
EOF`
ask=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "bug.com",
      "port": "80",
      "id": "${uuid}",
      "aid": "0",
      "net": "ws",
      "path": "/vmess",
      "type": "none",
      "host": "${domain}",
      "tls": "none"
}
EOF`
grpc=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "${domain}",
      "port": "443",
      "id": "${uuid}",
      "aid": "0",
      "net": "grpc",
      "path": "vmess-grpc",
      "type": "none",
      "host": "bug.com",
      "tls": "tls"
}
EOF`
vmess_base641=$( base64 -w 0 <<< $vmess_json1)
vmess_base642=$( base64 -w 0 <<< $vmess_json2)
vmess_base643=$( base64 -w 0 <<< $vmess_json3)
vmesslink1="vmess://$(echo $asu | base64 -w 0)"
vmesslink2="vmess://$(echo $ask | base64 -w 0)"
vmesslink3="vmess://$(echo $grpc | base64 -w 0)"

systemctl restart xray > /dev/null 2>&1
service cron restart > /dev/null 2>&1

clear
echo -e "\033[0;34m═════════════\033[0;33mXRAY/VMESS\033[0;34m═════════════\033[0m"
echo -e "\033[0;34m════════════════════════════════════\033[0m"
echo -e "Remarks        : ${user}"
echo -e "Domain         : ${domain}"
echo -e "Port TLS       : 443, 8443, 2096,2087"
echo -e "Port none TLS  : 80, 8080, 8880, 2082"
echo -e "Port gRPC      : 443, 8443, 2096, 2087"
echo -e "id             : ${uuid}"
echo -e "alterId        : 0"
echo -e "Security       : auto"
echo -e "Network        : ws"
echo -e "Path           : /vmess"
#echo -e "Path           : /worryfree" 
#echo -e "Path           : http://bug/worryfree" 
#echo -e "Path           : /kuota-habis" 
echo -e "ServiceName    : vmess-grpc"
echo -e "\033[0;34m════════════════════════════════════\033[0m"
echo -e "Link TLS       : ${vmesslink1}"
echo -e "\033[0;34m════════════════════════════════════\033[0m"
echo -e "Link none TLS  : ${vmesslink2}"
echo -e "\033[0;34m════════════════════════════════════\033[0m"
echo -e "Link gRPC      : ${vmesslink3}"
echo -e "\033[0;34m════════════════════════════════════\033[0m"
echo -e "Expired On     : $exp"
echo -e "\033[0;34m════════════════════════════════════\033[0m"
echo ""
read -n 1 -s -r -p "Press any key to back on menu"
    
    menu-vmess
    
}

function renewws(){
clear
NUMBER_OF_CLIENTS=$(grep -c -E "^### " "/etc/xray/config.json")
	if [[ ${NUMBER_OF_CLIENTS} == '0' ]]; then
		clear
        echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "\E[42;1;37m            Renew Vmess            \E[0m"
        echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
		echo ""
		echo "You have no existing clients!"
		echo ""
		echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        read -n 1 -s -r -p "Press any key to back on menu"
        menu
	fi

	clear
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\E[42;1;37m            Renew Vmess            \E[0m"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
  	grep -E "^### " "/etc/xray/config.json" | cut -d ' ' -f 2-3 | column -t | sort | uniq
    echo ""
    red "tap enter to go back"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
	read -rp "Input Username : " user
    if [ -z $user ]; then
    menu
    else
    read -p "Expired (days): " masaaktif
    exp=$(grep -wE "^### $user" "/etc/xray/config.json" | cut -d ' ' -f 3 | sort | uniq)
    now=$(date +%Y-%m-%d)
    d1=$(date -d "$exp" +%s)
    d2=$(date -d "$now" +%s)
    exp2=$(( (d1 - d2) / 86400 ))
    exp3=$(($exp2 + $masaaktif))
    exp4=`date -d "$exp3 days" +"%Y-%m-%d"`
    sed -i "/### $user/c\### $user $exp4" /etc/xray/config.json
    systemctl restart xray > /dev/null 2>&1
    clear
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo " XRAY Account Was Successfully Renewed"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo " Client Name : $user"
    echo " Expired On  : $exp4"
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    read -n 1 -s -r -p "Press any key to back on menu"
    menu
  fi
}
function delws() {
clear
NUMBER_OF_CLIENTS=$(grep -c -E "^### " "/etc/xray/config.json")
	if [[ ${NUMBER_OF_CLIENTS} == '0' ]]; then
		echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "\E[42;1;37m       Delete Vmess Account        \E[0m"
        echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
		echo ""
		echo "You have no existing clients!"
		echo ""
		echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
		read -n 1 -s -r -p "Press any key to back on menu"
        menu
	fi

	clear
	echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\E[42;1;37m       Delete Vmess Account        \E[0m"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "  User       Expired  " 
	echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
	grep -E "^### " "/etc/xray/config.json" | cut -d ' ' -f 2-3 | column -t | sort | uniq
    echo ""
    red "tap enter to go back"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
	read -rp "Input Username : " user
    if [ -z $user ]; then
    menu
    else
    exp=$(grep -wE "^### $user" "/etc/xray/config.json" | cut -d ' ' -f 3 | sort | uniq)
    sed -i "/^### $user $exp/,/^},{/d" /etc/xray/config.json
    systemctl restart xray > /dev/null 2>&1
    clear
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e " XRAY Account Deleted Successfully"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo " Client Name : $user"
    echo " Expired On  : $exp"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    read -n 1 -s -r -p "Press any key to back on menu"
    
    menu
    fi
}

function user-ws(){
clear
#MYIP=$(wget -qO- ipv4.icanhazip.com);
NUMBER_OF_CLIENTS=$(grep -c -E "^### " "/etc/xray/config.json")
        if [[ ${NUMBER_OF_CLIENTS} == '0' ]]; then
                echo -e "\033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
                echo -e "\E[42;1;37m     Check Detail XRAY Vmess     \E[0m"
                echo -e "\033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
                echo ""
                echo "You have no existing clients!"
                clear
                exit 1
        fi

        echo -e "\033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
        echo -e "\E[42;1;37m     Check Detail XRAY Vmess     \E[0m"
        echo -e "\033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
        echo " Select the existing client to view the config"
        echo " Press CTRL+C to return"
		echo -e "\033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
        echo "     No  User   Expired"
        grep -E "^### " "/etc/xray/config.json" | cut -d ' ' -f 2-3 | nl -s ') '
	    until [[ ${CLIENT_NUMBER} -ge 1 && ${CLIENT_NUMBER} -le ${NUMBER_OF_CLIENTS} ]]; do
                if [[ ${NUMBER_OF_CLIENTS} == '0' ]]; then
        echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                        read -rp "Select one client [1]: " CLIENT_NUMBER
                else
                        read -rp "Select one client [1-${NUMBER_OF_CLIENTS}]: " CLIENT_NUMBER
                fi
        done
user=$(cat /etc/xray/config.json | grep '^###' | cut -d ' ' -f 2 | sed -n "${CLIENT_NUMBER}"p)
#tls="$(cat ~/log-install.txt | grep -w "Vmess TLS" | cut -d: -f2|sed 's/ //g')"
#none="$(cat ~/log-install.txt | grep -w "Vmess None TLS" | cut -d: -f2|sed 's/ //g')"
domain=$(cat /etc/xray/domain)
uuid=$(grep "},{" /etc/xray/config.json | cut -b 11-46 | sed -n "${CLIENT_NUMBER}"p)
exp=$(grep -E "^### " "/etc/xray/config.json" | cut -d ' ' -f 3 | sed -n "${CLIENT_NUMBER}"p)
hariini=`date -d "0 days" +"%Y-%m-%d"`
asu=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "bug.com",
      "port": "443",
      "id": "${uuid}",
      "aid": "0",
      "net": "ws",
      "path": "/vmess",
      "type": "none",
      "host": "${domain}",
      "tls": "tls"
}
EOF`
ask=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "bug.com",
      "port": "80",
      "id": "${uuid}",
      "aid": "0",
      "net": "ws",
      "path": "/vmess",
      "type": "none",
      "host": "${domain}",
      "tls": "none"
}
EOF`
grpc=`cat<<EOF
      {
      "v": "2",
      "ps": "${user}",
      "add": "${domain}",
      "port": "443",
      "id": "${uuid}",
      "aid": "0",
      "net": "grpc",
      "path": "vmess-grpc",
      "type": "none",
      "host": "bug.com",
      "tls": "tls"
}
EOF`
vmess_base641=$( base64 -w 0 <<< $vmess_json1)
vmess_base642=$( base64 -w 0 <<< $vmess_json2)
vmess_base643=$( base64 -w 0 <<< $vmess_json3)
vmesslink1="vmess://$(echo $asu | base64 -w 0)"
vmesslink2="vmess://$(echo $ask | base64 -w 0)"
vmesslink3="vmess://$(echo $grpc | base64 -w 0)"
clear
echo -e ""
echo -e "\033[0;34m═══════════\033[0;33mXRAY/VMESS\033[0;34m═══════════${NC}"
echo -e "\033[0;34m════════════════════════════════${NC}"
echo -e "Remarks       : ${user}"
echo -e "Expired On    : $exp" 
echo -e "Domain        : ${domain}" 
echo -e "Port TLS      : 443, 8443, 2096, 2087" 
echo -e "Port none TLS : 80, 8080, 8880, 2082" 
echo -e "Port  GRPC    : 443, 8443, 2096, 2087" 
echo -e "id            : ${uuid}" 
echo -e "alterId       : 0" 
echo -e "Security      : auto" 
echo -e "Network       : ws" 
echo -e "Path          : /vmess" 
#echo -e "Path          : /worryfree" 
#echo -e "Path          : http://bug/worryfree" 
#echo -e "Path          : /kuota-habis" 
echo -e "ServiceName   : vmess-grpc" 
echo -e "\033[0;34m════════════════════════════════${NC}" 
echo -e "Link TLS : "
echo -e "${vmesslink1}" 
echo -e "\033[0;34m════════════════════════════════${NC} "
echo -e "Link none TLS : "
echo -e "${vmesslink2}" 
echo -e "\033[0;34m════════════════════════════════${NC} "
echo -e "Link GRPC : "
echo -e "${vmesslink3}"
echo -e "\033[0;34m════════════════════════════════${NC}" 
echo -e "\033[0;32m Sc By Arya Blitar ${NC}" 
echo -e ""
read -n 1 -s -r -p "Press any key to back on menu"
menu-vmess
}

clear
echo -e "${PURPLE}┌─────────────────────────────────────────────────┐${NC}"
echo -e "${PURPLE}│\E[42;1;37m                    VMESS MENU                   ${PURPLE}│$NC"
echo -e "${PURPLE}└─────────────────────────────────────────────────┘${NC}"
echo -e "${PURPLE}┌─────────────────────────────────────────────────┐${NC}"
echo -e "     ${PURPLE}[${BIWhite}1${PURPLE}]${NC} Create Vmess Account     "
echo -e "     ${PURPLE}[${BIWhite}2${PURPLE}]${NC} Trial Vmess Account     "
echo -e "     ${PURPLE}[${BIWhite}3${PURPLE}]${NC} Delete Account Vmess     "
echo -e "     ${PURPLE}[${BIWhite}4${PURPLE}]${NC} Renew Account Vmess     "
echo -e "     ${PURPLE}[${BIWhite}5${PURPLE}]${NC} User Account Vmess     "
echo -e ""
echo -e "     ${PURPLE}[${BIWhite}0${PURPLE}]${NC} Back To Menu     "
echo -e "${PURPLE}└──────────────────────────────────────────────────┘${NC}"
echo ""
read -p " Select menu : " opt
echo -e ""
case $opt in
1) clear ; add-ws ;;
2) clear ; trialvmess ;;
3) clear ; delws ;;
4) clear ; renewws;;
5) clear ; user-ws;;
0) clear ; menu ;;
x) exit ;;
*) echo -e "" ; echo " Klik Enter Balik Menu" ; sleep 1 ; menu ;;
esac
