# Diactoros

This is the Swipes Push Notification Server. All notifications to the
Apple Push Notification server (APN) and the Google Cloud 
Messaging server (GCM) go through this server.  

There are two primary endpoints for the server:  
* ``/APN``
* ``/GCM``  

Each endpoint servers the respective server. 
___ 
### Setup
Change the env file to have the filenames of the respective production/staging key or certificate.

STAGING_APN_CERT = the filename of your development certificate (.pem file)
STAGING_APN_KEY = the filename of your development key (.pem file)

And use PROD_APN_KEY and PROD_APN_CERT for the production server.

To run in development mode, '''npm run debug'''
Otherwise, specify your env variables elsewhere for production.
___
### APN 

To send a APN notification, send a POST request with the following
JSON data:
```
{
"tokens": [deviceTokens],  
   "data": {  
      specify your payload  
   }  
 }  
 ```

___
### GCM
To send a GCM notification, send a POST request with the following
JSON data:
```
{
   "tokens": [deviceTokens],
   "collapseKey": String (not required),
   "data": {
      specify your payload
    }
}
```