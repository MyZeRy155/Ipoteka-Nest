#!/bin/sh

npm run db:migrate

npm run db:seed

exec npm run start:prod