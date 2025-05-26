import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dj5sf6jb3', // Replace with your Cloudinary cloud name
    api_key: '471631229529229', // Replace with your Cloudinary API key
    api_secret: 'fD0iWLRkq5JFBtRRhDqc9EeWUc4', // Replace with your Cloudinary API secret
  });

  export default cloudinary;