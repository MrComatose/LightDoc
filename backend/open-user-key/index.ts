import * as fs from 'fs';
import * as gost from 'node-gost';  // Importing the node-gost module

const outputFile: string = 'decrypted_key.pem';

export const decryptKey = async (inputFile: string, password: string): Promise<void> => {
    try {
        // Load the encrypted key from the file
        const encryptedKey: Buffer = fs.readFileSync(inputFile);

        console.log(Object.keys(gost)); console.log(gost.keys); console.log(gost.cms);  // Check if CMS (Cryptographic Message Syntax) can help with decryption
        console.log(gost.cert); // Check if Cert methods help with the decryption process
        // Decrypt the key with the provided password        
        const decryptedKey: Buffer = await gost.decryptKey(encryptedKey, password); // Assuming decryptKey method exists


        // Save the decrypted key to a file
        fs.writeFileSync(outputFile, decryptedKey);
        console.log('Key successfully decrypted and saved.');
    } catch (err) {
        console.error('Error during decryption:', err);
    }
};