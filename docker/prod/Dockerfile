

FROM node:18-alpine as builder


# working directory
WORKDIR /app


# copy package.json file
COPY package*.json ./


# install project dependencies with ci: ci package.lock mai jo file hoti hai usse hi use karta hai kyo ki hamare pass jo packages hai build karte time unka version update hosakte hai and package.json mai bhi version update hote hai but package.lock mai wahi version rahte hai jisse hamare code mai kuch problem nahi aayenge agar version update hote hai to
RUN npm ci


# copy source code left wala . means file system and right wala . means image ka
COPY . .


# build project
RUN npm run build


# yaha tak hamari 1st step hogayi hamara pass dist folder generate hojayega




# 2nd step


# production ki jagah ham kush bhi name de sakte hai
FROM node:18-alpine as production


# setup env
ENV NODE_ENV=production


# working directory
WORKDIR /app


# copy package.json file
COPY package*.json ./


# install project dependencies --ignore-scripts security ke liye hai agar package.json mai koi script hai to wo installation ke time run hojati hai jisse ham ignore karange.ham ne env production pass kiya hai jisse sirf production dependencies install hogi dev dependencies install nahi hogi. isse hamarai image ki size bhi kam ho jaye gi.
RUN npm ci --ignore-scripts




# ham 1st step se copy karenge dist folder
COPY --from=builder /app/dist ./


# ham 5500 port par run karenge ham ne yaha par documentation ke purpose se diya hame docker run kare time -p flag dena hota hai port ki liye
EXPOSE 5500


# run command when container is start
CMD [ "node", "src/server.js" ]
