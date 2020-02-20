import decompress from 'decompress';
import fs from 'fs';
import util from 'util';
import axios from 'axios';
import path from 'path';
import azure from 'azure-storage';
require('dotenv').config()

const readFile = util.promisify(fs.readFile);

const {
	STORAGE_NAME ,
	STORAGE_CONTAINER ,
	STORAGE_KEY , 
	TARGET_URL
	
} = process.env ; 

const uploadStorageOptons = {
	container : STORAGE_CONTAINER,
	name : STORAGE_NAME , 
	key : STORAGE_KEY
};

const blobService = azure.createBlobService(uploadStorageOptons.name , uploadStorageOptons.key);

const fileURL = TARGET_URL;
const target = path.join(__dirname, '/', 'target');

console.info({ target });

export async function decompressData(){
	const file = ( await axios.get(fileURL , {
            responseType: 'arraybuffer'
        }) ).data
	console.info("download ok");
	const folderName = new Date().getTime();
	
	const decompressFiles  = await decompress(file , `${target}/${folderName}`) ; 
	
	decompressFiles.map(async (file)=>{
		
		await uploadToStorage(file , folderName);
		
	})
	console.info("ok");
	
}

export async function uploadToStorage(file , folderName){
	
	return new Promise((resolve , reject)=>{
		blobService.createBlockBlobFromLocalFile(uploadStorageOptons.container ,` ${folderName}/${file.path}`, `${target}/${file.path}` , function(error, result, response) {
			if (!error) {
				
				resolve();
			}else{
				reject(error);
				
			}
		});
	})
}

(async function init(){
	await decompressData();
	try {
		await uploadToStorage();
		console.info("upload successful");
	}catch(e){
		//console.info("upload failed" , e);
	}
}())
