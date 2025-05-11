FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y curl supervisor && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /Gravity

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /Gravity

WORKDIR /Gravity/src/frontend
RUN npm install && \
    npm run build

EXPOSE 5000
EXPOSE 3000

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
