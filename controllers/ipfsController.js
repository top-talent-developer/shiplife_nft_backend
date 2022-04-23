const config = require('../config/config');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const nftController = require('./apiController')

const pinataApiKey = config.pinataApiKey;
const pinataSecretApiKey = config.pinataSecretApiKey;

const urlFile = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const urlJSON = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';


const insertImageList = async (imgDataPath) => {
    try {
        const files = fs.readdirSync(imgDataPath)
        console.log('Upload started to IPFS')
        var ind=0;
        for (const file of files) {
            ind++;
            const res = await pinFileToIPFS(imgDataPath + "/" + file, "SHIP("+ ind+")", {})
            if (res.status == 200) {
                var imgHash = res.data.IpfsHash;
                var response = await nftController.insertData({ filehash: imgHash });
                var jsonData = {
                    pinataMetadata: {
                        name: "Data-SHIP(" + ind+")"
                    },
                    pinataContent: {
                        name: `${"SHIP(" + ind+")"}`,
                        description: `Friendly OpenSea Creature that enjoys long swims in the ocean.`,
                        image: `https://ipfs.io/ipfs/${imgHash}`,
                        external_url: `https://ipfs.io/ipfs/${imgHash}`,
                        "attributes": [
                            {
                                "trait_type": "level",
                                "value": 1
                            }
                        ],
                    }
                };
                const resJSON = await pinJSONToIPFS(imgHash, jsonData, { name: `hashId for NFT image ${imgHash}` })
                if (resJSON.status == 200) {
                    var metaHash = resJSON.data.IpfsHash;
                    nftController.updateJsonHash(response.data.id, metaHash, jsonData)
                    console.log("uploaded *** " + imgHash + " ***")
                    for (var w = 0; w < 10000; w++) { }
                }
            }
        }
        console.log(`${files.length} files upload finished`)
        return { err: 0, msg: 'success', total: files.length }
    } catch (error) {
        console.log(error)
        return { err: 1, msg: error }
    }
}

const pinFileToIPFS = async (fileName, pinataName, keyvalues) => {
    try {
        let data = new FormData();
        data.append('file', fs.createReadStream(fileName));
        /* const metadata = JSON.stringify({
            name: pinataName,
            keyvalues: keyvalues
        });
        data.append('pinataMetadata', metadata); */
        /* const pinataOptions = JSON.stringify({
            cidVersion: 0,
            customPinPolicy: {
                regions: [
                    {
                        id: 'FRA1',
                        desiredReplicationCount: 1
                    },
                    {
                        id: 'NYC1',
                        desiredReplicationCount: 2
                    }
                ]
            }
        });
        data.append('pinataOptions', pinataOptions); */
        var res = await axios
            .post(urlFile, data, {
                maxBodyLength: 'Infinity',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey
                }
            });

        return Promise.resolve(res)
    } catch (ex) {
        console.log(ex)
    }
}

const pinJSONToIPFS = async (imgHash, JSONBody, metadata) => {
    return Promise.resolve(axios
        .post(urlJSON, JSONBody, {
            headers: {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataSecretApiKey
            }
        }))
};

module.exports = { insertImageList }
