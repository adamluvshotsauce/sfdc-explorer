const fs = require('fs').promises;
const converter = require('json-2-csv');

module.exports = {
    async wipeFile(filePath) {
        // write json data to a file
        await fs.writeFile(filePath, '', 'utf8', (err, data) => {
            console.log(`writeFile data: ${data}`);
            console.log(`writeFile err: ${err}`);
        });
        // read json file
        return this.readFile(filePath);
    },

    async writeToFile(filePath, json) {
        console.log(`writeToFile filePath: ${filePath}`);
        // write json data to a file
        await fs.writeFile(filePath, json, 'utf8', (err) => {
            console.log(`writeFile err: ${err}`);
        });
        // read json file
        return this.readFile(filePath);
    },

    async readFile(filePath) {
        console.log(`readFile filePath: ${filePath}`);
        return await JSON.parse(await fs.readFile(filePath, (err, data) => {
            console.log(`readFile data: ${data}`);
            console.log(`readFile err: ${err}`);
        }));
    },

    async getColumns(data) {
        //console.log(`data for table headers: \n${JSON.stringify(data[0], null, 2)}`);
        // only need one record to get the keys
        const obj = {...data[0]};

        let keys = Object.keys(obj);
        //console.log(`obj keys: \n${JSON.stringify(keys, null, 2)}`);
        return keys;
    },

    async count(json) {
        return Object.keys(json).length;
    },

    async writeCsv(sourcePath, targetPath) {
        const jsonFile = await this.readFile(sourcePath);

        // convert json document array to csv string
        converter.json2csv(jsonFile, (err, csv) => {
            if (err) { throw err;  }
            // print csv string
            console.log(csv);
            // write csv string to a file
            fs.writeFile(targetPath, csv);
        });

        // return target file path
        return targetPath;
    },
    
    async markSelected(options, selection) {
        // console.log(`mark selected options BEFORE: ${JSON.stringify(options, null, 2)}`);
        // console.log(`mark selected selection: ${selection}`);

        return options.map((option) => {
            option.value === selection ?
                option.selected = true :
                option.selected = false;
            return option;
        });
    },

    async unselectAll(options) {
        //console.log(`unselected options: ${JSON.stringify(options, null, 2)}`);
        return options.map(option => option.selected = false);
    },

    async runCalculations(params, record) {
        let data = record;

        // handle date calcs
        if (params.type === 'date') {

            let date1 = new Date(data[params.firstField]);
            let date2 = new Date(data[params.secondField]);
            date2.setDate(date2.getDate() + 1);

            // console.log(`date1: ${date1}`);
            // console.log(`date2: ${date2} \n`);

            if (params.operation === 'months between') {
                // calc months in between for both dates
                let years = date2.getFullYear() - date1.getFullYear();
                //console.log(`years: ${years}`);

                let monthsBetween = (years * 12) + (date2.getMonth() - date1.getMonth());
                //console.log(`monthsBetween: ${monthsBetween}`);

                data[params.keyName] = monthsBetween;
            }
        }

        return data;
    }
}