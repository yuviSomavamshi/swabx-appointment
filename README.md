# appointment_scheduler

This Project is intended to maintain the appointment schedules of the customer

## step to run doker

sudo docker run -it --name a_s -p 8985:8985 -e database=schedule_dev -e host=192.168.0.104 -e username=root -e password=nviera@123 appointment_scheduler:1.0.0
