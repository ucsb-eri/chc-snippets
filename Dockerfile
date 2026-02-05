# Use Nginx image from Docker Hub
FROM nginx:alpine

# Copy static files to Nginx serve directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
