# MongoDB Installation Guide for Windows

1. Download MongoDB Community Server:
   - Go to: https://www.mongodb.com/try/download/community
   - Select "Windows" as your platform
   - Click "Download" for the latest version

2. Install MongoDB:
   - Run the downloaded .msi installer
   - Choose "Complete" installation
   - IMPORTANT: Check "Install MongoDB as a Service"
   - Keep the default installation path (C:\Program Files\MongoDB\Server\[version])
   - Complete the installation

3. Create data directory:
   ```cmd
   md C:\data\db
   ```

4. Verify Installation:
   - Open Command Prompt as Administrator
   - Run: `mongod --version`

5. Start MongoDB:
   - Open Services (Win + R, type "services.msc")
   - Find "MongoDB" in the list
   - Right-click and select "Start"
   - Set Startup type to "Automatic"

6. Test Connection:
   - Open Command Prompt
   - Run: `mongosh`
   - You should see the MongoDB shell

After completing these steps, MongoDB will be installed and running as a Windows service.

To use with our pharmacy system:
1. Make sure MongoDB service is running
2. Run: `npm run seed` to populate the database
3. Run: `npm start` to start the application

Troubleshooting:
- If MongoDB service doesn't start, check Windows Event Viewer for errors
- Ensure ports 27017 is not blocked by firewall
- Verify data directory permissions
