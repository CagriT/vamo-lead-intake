# ---- runtime stage ----
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx template
COPY nginx.heroku.conf /etc/nginx/templates/default.conf.template

# Expose port (Heroku ignores but OK)
EXPOSE 8080

# Let nginx envsubst inject $PORT
CMD ["nginx", "-g", "daemon off;"]
