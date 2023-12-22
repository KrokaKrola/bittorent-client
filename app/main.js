const process = require("process");
const fs = require("fs");

/**
 *
 * @param bencodedString {string}
 * @returns {{value: string, length: number}}
 */
function decodeBencodeString(bencodedString) {
    const firstColonIndex = bencodedString.indexOf(":");
    if (firstColonIndex === -1) {
        throw new Error("Invalid encoded value");
    }

    const bencodedStringSize = bencodedString.slice(0, firstColonIndex);
    const length = bencodedStringSize.length + 1 + Number(bencodedStringSize);

    return {
        value: bencodedString.slice(firstColonIndex + 1, length),
        length,
    };
}

/**
 *
 * @param bencodedNumber {string}
 * @returns {{length: number, value: number}}
 */
function decodeBencodeNumber(bencodedNumber) {
    let cursor = 0;
    let numberString = "";

    while (bencodedNumber[cursor] !== 'e') {
        if (cursor >= bencodedNumber.length) {
            throw new Error("Invalid encoded value");
        }

        cursor++;
        numberString += bencodedNumber[cursor];
    }

    return {
        value: parseInt(numberString),
        length: cursor + 1
    };
}

/**
 *
 * @param bencodedList {string}
 * @returns {{length: number, value: *[]}}
 */
function decodeBencodeList(bencodedList) {
    // start from 1 to skip the 'l' character
    let cursor = 1;
    let list = [];

    // end at -1 to skip the 'e' character
    while (cursor < bencodedList.length - 1) {
        // console.log(cursor, [cursor])
        if (!isNaN(+bencodedList[cursor])) {
            const result = decodeBencodeString(bencodedList.slice(cursor));
            list.push(result.value);
            cursor += result.length;
        } else if (bencodedList[cursor] === 'i') {
            const result = decodeBencodeNumber(bencodedList.slice(cursor));
            list.push(result.value);
            cursor += result.length;
        } else if (bencodedList[cursor] === 'l') {
            const result = decodeBencodeList(bencodedList.slice(cursor, bencodedList.length - 1));
            list.push(result.value);
            cursor += result.length;
        } else if (bencodedList[cursor] === 'd') {
            const result = decodeBencodeDictionary(bencodedList.slice(cursor, bencodedList.length - 1));
            list.push(result.value);
            cursor += result.length;
        } else if (bencodedList[cursor] === 'e') {
            break;
        } else {
            throw new Error("Only strings/numbers/lists are supported at the moment");
        }
    }

    return {
        value: list,
        length: cursor + 1
    }
}

/**
 *
 * @param bencodedDictionary {string}
 * @returns {{length: number, value: Record<string, unknown>}}
 */
function decodeBencodeDictionary(bencodedDictionary) {
    // start from 1 to skip the 'd' character
    let cursor = 1;
    let dictionary = {};

    // end at -1 to skip the 'e' character
    while (cursor < bencodedDictionary.length - 1) {
        if (bencodedDictionary[cursor] === 'e') {
            break;
        }

        const result = decodeBencodeString(bencodedDictionary.slice(cursor));
        const key = result.value;
        cursor += result.length;

        if (!isNaN(+bencodedDictionary[cursor])) {
            const result = decodeBencodeString(bencodedDictionary.slice(cursor));
            dictionary[key] = result.value;
            cursor += result.length;
        } else if (bencodedDictionary[cursor] === 'i') {
            const result = decodeBencodeNumber(bencodedDictionary.slice(cursor));
            dictionary[key] = result.value;
            cursor += result.length;
        } else if (bencodedDictionary[cursor] === 'l') {
            const result = decodeBencodeList(bencodedDictionary.slice(cursor, bencodedDictionary.length - 1));
            dictionary[key] = result.value;
            cursor += result.length;
        } else if (bencodedDictionary[cursor] === 'd') {
            const result = decodeBencodeDictionary(bencodedDictionary.slice(cursor, bencodedDictionary.length - 1));
            dictionary[key] = result.value;
            cursor += result.length;
        } else {
            throw new Error("Only strings/numbers/lists/dictionaries are supported at the moment");
        }
    }

    return {
        value: dictionary,
        length: cursor + 1
    }
}

/**
 *
 * @param bencodedValue {string}
 * @returns {number|string|*[]|Record<string, unknown>}
 */
function decodeBencode(bencodedValue) {
    if (!isNaN(+bencodedValue[0])) {
        return decodeBencodeString(bencodedValue).value;
    } else if (bencodedValue[0] === 'i') {
        return decodeBencodeNumber(bencodedValue).value;
    } else if (bencodedValue[0] === 'l') {
        return decodeBencodeList(bencodedValue).value;
    } else if (bencodedValue[0] === 'd') {
        return decodeBencodeDictionary(bencodedValue).value;
    } else {
        throw new Error("Only strings/numbers/lists/dictionaries are supported at the moment");
    }
}

function main() {
    const command = process.argv[2];

    if (command === "decode") {
        const bencodedValue = process.argv[3];

        console.log(JSON.stringify(decodeBencode(bencodedValue)));
    } else if (command === "info") {
        const filePath = process.argv[3];

        const file = fs.readFileSync(filePath, 'utf8');

        const res = decodeBencode(file.toString());

        console.log(`"Tracker URL: ${res.announce}"`);
        console.log(`"Length: ${res.info.length}"`);
    } else {
        throw new Error(`Unknown command ${command}`);
    }
}

main();
