#!/bin/bash

#启动服务
service iptables start

#首先在清除前要将policy INPUT改成ACCEPT,表示接受一切请求。
#这个一定要先做，不然清空后可能会悲剧
iptables -P INPUT ACCEPT

#清空默认所有规则
iptables -F

#清空自定义的所有规则
iptables -X

#计数器置0
iptables -Z

service iptables save

#允许来自于lo接口的数据包
#如果没有此规则，你将不能通过127.0.0.1访问本地服务，例如ping 127.0.0.1
iptables -A INPUT -i lo -j ACCEPT

#ss端口
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
#ssh端口 22
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
#FTP端口21
#iptables -A INPUT -p tcp --dport 21 -j ACCEPT
#web服务端口80
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

#允许icmp包通过,也就是允许ping
iptables -A INPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT

#允许所有对外请求的返回包
#本机对外请求相当于OUTPUT,对于返回数据包必须接收啊，这相当于INPUT了
iptables -A INPUT -m state --state ESTABLISHED -j ACCEPT

#如果要添加内网ip信任（接受其所有TCP请求）
#iptables -A INPUT -p tcp -s 123.56.140.92 -j ACCEPT
#过滤所有非以上规则的请求
iptables -P INPUT DROP

service iptables save
service iptables restart
service iptables status

chkconfig iptables on


