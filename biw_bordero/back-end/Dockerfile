# Usa Node.js 22 como base
FROM node:22

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install --production


# Copia todo o restante do projeto
COPY . .

# Expõe a porta que seu backend usa (ex: 3000)
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
