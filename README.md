# 🚀 Alex Booking Backend Deployment Guide

This guide provides the necessary steps to manually deploy the backend and connect your domain using Nginx on a DigitalOcean Droplet.

## Current Live Link (BASE URL)

```bash
https://api.209.38.80.244.nip.io/api/v1
```

---

## 🖥️ Server Login

```bash
ssh root@209.38.80.244
```

---

## 🔄 Run Deployment Script

```bash
./deploy.sh
```

---

## 🌐 Connect Domain to Backend

1. **Open Nginx Config File:**

```bash
nano /etc/nginx/sites-available/alex-booking-backend
```

2. **Update the `server_name` Block:**

```nginx
server {
    listen 80;
    server_name https://www.api.alexrodriguez.com.au/;  # Replace with your actual domain

    location / {
        proxy_pass http://localhost:8000;
        # Additional configuration (headers, timeouts, etc.) can go here
    }
}
```

3. **Create a Symlink (if not already done):**

```bash
sudo ln -s /etc/nginx/sites-available/alex-booking-backend /etc/nginx/sites-enabled/
```

4. **Test and Reload Nginx:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Done!

Your backend should now be accessible at:

```
https://www.api.alexrodriguez.com.au/
```

---

## 🔒 (Optional) Enable HTTPS with Let's Encrypt

To secure your API with SSL, run:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d https://www.api.alexrodriguez.com.au/
```

---

> 📌 Make sure your domain `https://www.api.alexrodriguez.com.au/` is pointing to your Droplet's IP (`209.38.80.244`) via DNS A record.
