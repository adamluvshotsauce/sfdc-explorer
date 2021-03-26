/**
 * Required External Modules
 */

const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const jsforce = require("jsforce");
const utils = require('./lib/utils/utils');


/**
 * App Variables
 */

const app = express();
const port = 3000;

const connFilePath = './lib/conn/conn.json';
const jsonFilePath = './data/results.json';
const jsonFormPath = './data/form.json';
const csvFilePath = './data/download.csv';

const sfdcInstanceUrls = [
    { name: 'Production (https://login.salesforce.com)', 
      value:'https://login.salesforce.com',
      selected: false 
    },
    { name: 'Sandbox (https://test.salesforce.com)', 
      value:'https://test.salesforce.com',
      selected: false
    }
];

const calcOperations = [
    {name: 'Days Between', value: 'days between', selected: false},
    {name: 'Months Between', value: 'months between', selected: false},
    {name: 'Years Between', value: 'years between', selected: false}
];

const sqCalcOperations = [
    {name: 'Days Between', value: 'days between', selected: false},
    {name: 'Months Between', value: 'months between', selected: false},
    {name: 'Years Between', value: 'years between', selected: false}
];

const calcTypeOptions = [
    {name: 'Date', value: 'date', selected: false},
    {name: 'String', value: 'string', selected: false},
    {name: 'Integer', value: 'integer', selected: false}
];

const sqCalcTypeOptions = [
    {name: 'Date', value: 'date', selected: false},
    {name: 'String', value: 'string', selected: false},
    {name: 'Integer', value: 'integer', selected: false}
];

const advOperatorOptions = [
    {name: '>', value:  '>', selected: false},
    {name: '<', value: '<', selected: false},
    {name: '>=', value: '>=', selected: false},
    {name: '<=', value: '<=', selected: false},
    {name: '!=', value: '!=', selected: false},
    {name: '=', value: '=', selected: false},
];

/**
 *  App Configuration
 */

// Sets handlebars configurations
app.engine('.hbs', exphbs({
    // configuration parameters
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials/',
    extname: '.hbs',
    defaultLayout: 'default',
    helpers: require('./lib/helpers/handlebar-helpers')
}));

// Sets our app to use the handlebars engine
app.set('view engine', '.hbs');

app.locals.isAuthenticated = false;

// middleware
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.locals ? req.locals.isAuthenticated : false;

    console.log(`@@@ middleware - res.locals.isAuthenticated: ${res.locals.isAuthenticated}`);
    next();
});

// Serves static files (we need it to import a css file)
app.use(express.static('public'));
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));


/**
 * Route Definitions
 */

 // Home 
app.get('/', async (req, res) => {
    // Serves the body of the page aka "main.handlebars" to the container 
    // aka "index.handlebars"

    // await utils.wipeFile(jsonFilePath);
    // await utils.wipeFile(csvFilePath);
    // await utils.wipeFile(jsonFormPath);


    // unselect all options
    await utils.unselectAll(sfdcInstanceUrls);
    await utils.unselectAll(calcOperations);
    await utils.unselectAll(calcTypeOptions);
    await utils.unselectAll(advOperatorOptions);
    await utils.unselectAll(sqCalcOperations);
    await utils.unselectAll(sqCalcTypeOptions);

    // start witha blank form, also used for clearing the form
    const emptyForm = {
        query : null,
        calctype : null,
        calcparam1 : null,
        calcparam2 : null,
        calcoperation : null,
        advcalcfilter: null,
        advoperator: null,
        advcalcparam: null,
        transposeobj: null,
        transposefield: null
    };

    res.render('home', {
        layout: 'main', 
        calcOperations: calcOperations,
        calcTypeOptions: calcTypeOptions,
        advOperatorOptions: advOperatorOptions,
        sqCalcOperations: sqCalcOperations,
        sqCalcTypeOptions: sqCalcTypeOptions,
        sfdcInstanceUrls: sfdcInstanceUrls,
        form: emptyForm,
        locals: {isAuthenticated: app.locals.isAuthenticated}
    });
});

// Auth 
app.get('/auth/basic', async (req, res) => {
    // @TODO add the ability for basic auth using username/password flow
});

// Execute SOQL query
app.post('/query', async (req, res) => {
    // console.log(`Query: ${JSON.stringify(req.body.query)}`);
    // console.log(`Calculation type: ${JSON.stringify(req.body.calctype)}`);
    // console.log(`Calculation calcparam1: ${JSON.stringify(req.body.calcparam1)}`);
    // console.log(`Calculation calcoperation: ${JSON.stringify(req.body.calcoperation)}`);
    // console.log(`Calculation calcparam2: ${JSON.stringify(req.body.calcparam2)}`);
    // console.log(`Calculation advcalcfilter: ${JSON.stringify(req.body.advcalcfilter)}`);
    // console.log(`Calculation advoperator: ${JSON.stringify(req.body.advoperator)}`);
    // console.log(`Calculation advfilterparam: ${JSON.stringify(req.body.advfilterparam)}`);


    
    const results = {
        records: []
    };

    const form = {
        query : req.body.query,
        calctype : req.body.calctype,
        calcparam1 : req.body.calcparam1,
        calcparam2 : req.body.calcparam2,
        calcoperation : req.body.calcoperation,
        advcalcfilter: req.body.advcalcfilter,
        advoperator: req.body.advoperator,
        advfilterparam: req.body.advfilterparam,
        transposeobj: req.body.transposeobj,
        transposefield: req.body.transposefield,
        sqcalctype: req.body.sqcalctype,
        sqcalcparam1: req.body.sqcalcparam1,
        sqcalcparam2: req.body.sqcalcparam2,
        sqcalcoperation: req.body.sqcalcoperation
    };

    console.log(`form: ${JSON.stringify(form, null, 2)}`);

    // mark the selected options 
    const calcOpts = await utils.markSelected(calcOperations, form.calcoperation);
    const calcTypeOpts = await utils.markSelected(calcTypeOptions, form.calctype);
    const advOperatorOpts = await utils.markSelected(advOperatorOptions, form.advoperator);
    
    const sqCalcOpts = await utils.markSelected(sqCalcOperations, form.sqcalcoperation);
    const sqCalcTypeOpts = await utils.markSelected(sqCalcTypeOptions, form.sqcalctype);
    
    // console.log(`mark selected options AFTER: ${JSON.stringify(calcOpts, null, 2)}`);
    // console.log(`mark selected options AFTER: ${JSON.stringify(calcTypeOpts, null, 2)}`);
    // console.log(`mark selected options AFTER: ${JSON.stringify(advOperatorOpts, null, 2)}`);

    const connInfo = await utils.readFile(connFilePath);
    console.log(`@@@ connInfo: ${JSON.stringify(connInfo, null, 2)}`);

    const conn = new jsforce.Connection({
        instanceUrl : connInfo.instanceUrl,
        accessToken : connInfo.accessToken
    });
    
    await new Promise( async (resolve, reject) => {
        await conn.query(form.query)
        .on('record', async (record) => {
            // remove unnecessary attributes 
            delete record.attributes
            
            let data = {...record};
            //console.log(`data: ${JSON.stringify(data, null, 2)}`);
            //console.log(`@@@ calcOpts: ${JSON.stringify(calcOpts, null, 2)}`);

            // calculations
            if (form.calcoperation) {

                let calcKeyPrefix = calcOpts.find(obj => {
                    return obj.value === form.calcoperation;
                }).name;

                const keyName = `${calcKeyPrefix} (${form.calcparam1} - ${form.calcparam2})`;

                // console.log(`@@@ calcKeyName: ${calcKeyName}`);

                console.log(`@@@ starting calculations`);

                // data calcalucations
                data = await utils.runCalculations( {
                                        firstField: form.calcparam1,
                                        secondField: form.calcparam2,
                                        type: form.calctype,
                                        operation: form.calcoperation,
                                        keyName: keyName
                                    }, data);
                console.log(`@@@ finished calculations`);
                //console.log(`data after calc: ${JSON.stringify(data, null, 2)}`);
            }

            // transpose child field
            if (form.transposeobj 
                && data[form.transposeobj]
                && data[form.transposeobj].totalSize > 0) {

                console.log(`@@@ transposing child data`);

                let transposeColumn = `${form.transposeobj}.${form.transposefield}`;
                //console.log(`@@@ transposeColumn: ${transposeColumn}`);
                //console.log(`@@@ transpose data: ${data[form.transposeobj].records[0][form.transposefield]}`);

                data[transposeColumn] = data[form.transposeobj].records[0][form.transposefield];

                let sqCalcKeyPrefix = sqCalcOpts.find(obj => {
                    return obj.value === form.sqcalcoperation;
                }).name;

                const keyName = `${sqCalcKeyPrefix} (${form.sqcalcparam1} - ${form.sqcalcparam2})`;

                console.log(`@@@ starting child calculations`);

                // data calculations
                data = await utils.runCalculations( {
                    firstField: form.sqcalcparam1,
                    secondField: form.sqcalcparam2,
                    type: form.sqcalctype,
                    operation: form.calcoperation,
                    keyName: keyName
                }, data);

                console.log(`@@@ finished child calculations`);

                //console.log(`data after calc: ${JSON.stringify(data, null, 2)}`);

                delete data[form.transposeobj];
            }

            // advance filtering
            if (form.advcalcfilter) {
                //console.log(`inside advance filtering, form.advoperator: ${form.advoperator}`);
                
                switch (form.advoperator) {
                    case '>':
                        if (data[keyName] > data[form.advfilterparam]) {
                            results.records.push(data);
                        }

                        break;
                    case '<':
                        if (data[keyName] < data[form.advfilterparam]) {
                            results.records.push(data);
                        }

                        break;
                    case '>=':
                        if (data[keyName] >= data[form.advfilterparam]) {
                            results.records.push(data);
                        }

                        break;
                    case '<=':
                        if (data[keyName] <= data[form.advfilterparam]) {
                            results.records.push(data);
                        }

                        break;
                    case '!=':
                        if (data[keyName] !== data[form.advfilterparam]) {
                            results.records.push(data);
                            console.log(`@@@ adv filter data pushed`);
                        }

                        break;
                    case '=':
                        if (data[keyName] === data[form.advfilterparam]) {
                            results.records.push(data);
                        }

                        break;
                    default:
                        undefined;
                }
            }

            // handle when no advance filtering was applied
            if (!form.advcalcfilter) { results.records.push(data); }
            

        })
        .on('error', async (err) => {
            let error = JSON.stringify(err, null, 2);
            console.log(`json: \n${error}`);

            res.render('home', {layout: 'main', form: form, results: `\n${err}`});
        })
        .on('end', async () => {
            let jsonForm = JSON.stringify(form, null, 2);
            console.log(`@@@ writing form to json file`);
            await utils.writeToFile(jsonFormPath, jsonForm);

            
            // convert result records to json string
            let json = JSON.stringify(results.records, null, 2);
            //console.log(`json: \n${json}`);
            
            // write json to file then return it's parsed contents
            const jsonFile = await utils.writeToFile(jsonFilePath, json);
            console.log(`@@@ writing data to json file`);
            console.log(`jsonFile: \n${JSON.stringify(jsonFile, null, 2)}`);
        })
        .run({ autoFetch: true, maxFetch: 50000  });
    })
    .then( 
        // resolve with rendered data
        res.render('home',  {
            layout: 'main', 
            form: form,
            calcOperations: calcOpts,
            calcTypeOptions: calcTypeOpts,
            advOperatorOptions: advOperatorOpts,
            sqCalcOperations: sqCalcOpts,
            sqCalcTypeOptions: sqCalcTypeOpts,
            dataFetched: true,
            locals: {isAuthenticated: app.locals.isAuthenticated}
        })
        
    ).catch( (reason) => {
        console.log(`Query promise rejected with reason:\n${reason}`);
        
        // reject with no data
        res.render('home',  {
            layout: 'main', 
            form: form,
            calcOperations: calcOpts,
            calcTypeOptions: calcTypeOpts,
            advOperatorOptions: advOperatorOpts,
            sqCalcOperations: sqCalcOpts,
            sqCalcTypeOptions: sqCalcTypeOpts,
            dataFetched: false,
            locals: {isAuthenticated: app.locals.isAuthenticated}
        })
    });

});

// Download CSV
app.get('/download', async (req, res) => {

    const file = await utils.writeCsv(jsonFilePath, csvFilePath);
    res.download(file);
});

// Preview JSON
app.get('/preview', async (req, res) => {
    // read results and form files for refreshing
    // view on preview
    const jsonFile = await utils.readFile(jsonFilePath);
    const formFile = await utils.readFile(jsonFormPath);
    console.log(`@@@ finished form and json files`);
    
    console.log(`form: ${JSON.stringify(formFile)}}`);

    // create table columns from json
    const columns = await utils.getColumns(jsonFile);
    const count = await  utils.count(jsonFile);
    console.log(`@@@ finished constructing data table columns and count`);

    // mark the selected options
    const calcOpts = await utils.markSelected(calcOperations, formFile.calcoperation);
    const calcTypeOpts = await utils.markSelected(calcTypeOptions, formFile.calctype);
    const advOperatorOpts = await utils.markSelected(advOperatorOptions, formFile.advoperator);
    const sqCalcOpts = await utils.markSelected(sqCalcOperations, formFile.sqcalcoperation);
    const sqCalcTypeOpts = await utils.markSelected(sqCalcTypeOptions, formFile.sqcalctype);

    res.render('home',  {
        layout: 'main',
        form: formFile,
        calcOperations: calcOpts,
        calcTypeOptions: calcTypeOpts,
        advOperatorOptions: advOperatorOpts,
        sqCalcOperations: sqCalcOpts,
        sqCalcTypeOptions: sqCalcTypeOpts,
        dataFetched: true,
        columns: columns,
        data: jsonFile,
        count: count,
        preview: true,
        locals: {isAuthenticated: app.locals.isAuthenticated}
    });
});

// Login to SFDC
app.post('/login', async (req, res) => {
    try {
        console.log(`login req body: ${JSON.stringify(req.body, null, 2)}`);
    } catch (err) {
        console.log(`login error ${err}`);
    }

    const sfdcInstanceUrl = req.body.sfdcinstanceurl;
    const sfdcUsername = req.body.sfdcusername;
    const sfdcPassword = req.body.sfdcpassword;
    
    const sfdcConn = new jsforce.Connection({
        loginUrl: sfdcInstanceUrl
    });
      
    const username = sfdcUsername;
    const password = sfdcPassword;
    
    await sfdcConn.login(username, password, async (err, userInfo) => {
        if (err) {
            return console.error(err);
        }
        // Now you can get the access token and instance URL information.
        // Save them to establish connection next time.
        console.log(`Access Token: ${sfdcConn.accessToken}`);
        console.log(`Instance Url: ${sfdcConn.instanceUrl} \n`);

        const connInfo = {
            instanceUrl: sfdcConn.instanceUrl,
            accessToken: sfdcConn.accessToken
        };

        const connJson = JSON.stringify(connInfo, null, 2);
        console.log(`@@@ connJson: ${connJson}`);
        const connFile = await utils.writeToFile(connFilePath, connJson);
        console.log(`@@@ connFile: ${JSON.stringify(connFile, null, 2)}`);

        isAuthenticated = true;
        app.locals.isAuthenticated = true;

        // logged in user property
        console.log(`User ID: ${userInfo.id}`);
        console.log(`Org ID: ${userInfo.organizationId}`);
        console.log(`isAuthenticated: ${isAuthenticated}`);
        console.log(`app.locals.isAuthenticated: ${app.locals.isAuthenticated}`);
    });

    // unselect all options
    await utils.unselectAll(calcOperations);
    await utils.unselectAll(calcTypeOptions);
    await utils.unselectAll(advOperatorOptions);
    await utils.unselectAll(sqCalcOperations);
    await utils.unselectAll(sqCalcTypeOptions);

    await utils.markSelected(sfdcInstanceUrls, sfdcInstanceUrl);

    // start witha blank form, also used for clearing the form
    const emptyForm = {
        query : null,
        calctype : null,
        calcparam1 : null,
        calcparam2 : null,
        calcoperation : null,
        advcalcfilter: null,
        advoperator: null,
        advcalcparam: null,
        transposeobj: null,
        transposefield: null
    };

    res.render('home', {
        layout: 'main', 
        calcOperations: calcOperations,
        calcTypeOptions: calcTypeOptions,
        advOperatorOptions: advOperatorOptions,
        sqCalcOperations: sqCalcOperations,
        sqCalcTypeOptions: sqCalcTypeOptions,
        sfdcInstanceUrls: sfdcInstanceUrls,
        form: emptyForm,
        locals: {isAuthenticated: true}
    });
});


/**
 * Server Activation
 */

app.listen(port, () => console.log(`App listening to port ${port}`));