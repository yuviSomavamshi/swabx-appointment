start=`date +%s`
npm run prettify;
docker-compose -f docker-compose.yml build
docker tag appointment_scheduler blockchain.azurecr.io/appointment_scheduler
docker push blockchain.azurecr.io/appointment_scheduler
end=`date +%s.%N`

end=`date +%s`
runtime=$((end-start))
echo "$runtime"
