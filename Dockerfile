# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# The maintainer of this Dockerfile
LABEL maintainer="CERVELLO"

# Update and upgrade installed packages
RUN apk update && apk upgrade

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install --force

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your Express app is listening on (default is 3000)
EXPOSE 3000

# Define the command to run the application server
CMD ["node", "index.js"]




#FROM node:16-alpine as build-deps
#RUN apk update && apk upgrade
#WORKDIR /app
#COPY package.json yarn.lock ./
#RUN ls
#RUN yarn install --production
#RUN yarn global add @craco/craco
#RUN yarn global add npm@9.7.1
#RUN yarn add esm
#RUN yarn add --dev @babel/plugin-transform-private-property-in-object
#RUN npm rebuild node-sass
#RUN yarn global add serve
#COPY . ./
#RUN yarn build
#RUN npm run build
#ENV NODE_ENV production

######
#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 reactjs

#FROM nginx:1.25.0-alpine
#WORKDIR /usr/share/nginx/html
#RUN rm -rf *
#COPY --from=build-deps /app/build .

#USER reactjs

#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
