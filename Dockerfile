FROM node

ENV MONGO_DB_USERNAME=delta_admin \
    MONGO_DB_PWD=delta_password

RUN mkdir -p delta/nodeapp

COPY . /delta/nodeapp

CMD [ "node" ,  "/delta/nodeapp/server.js"]