// lip/helpers/handlebars-helpers.js
module.exports = {
    isNot (value) {
        console.log(`@@@ isNot: ${!value}`);
        return !value;
    },
    
    isNotZero(value) {
        return value !== 0;
    }
  }