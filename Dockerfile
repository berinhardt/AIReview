FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update \
   && apt-get install -y --no-install-recommends nodejs npm \
   && rm -rf /var/lib/apt/lists/*
#INSTALL DEPS
COPY package.json package-lock.json ./
RUN npm ci
#COPY SOURCE CODE
COPY . .
#BUILD
#RUN TESTS
CMD ["npm", "test"]
