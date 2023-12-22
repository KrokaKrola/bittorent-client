const process = require("process");

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
 * @param bencodedValue {string}
 * @returns {number|string|*[]}
 */
function decodeBencode(bencodedValue) {
    if (!isNaN(+bencodedValue[0])) {
        return decodeBencodeString(bencodedValue).value;
    } else if (bencodedValue[0] === 'i') {
        return decodeBencodeNumber(bencodedValue).value;
    } else if (bencodedValue[0] === 'l') {
        return decodeBencodeList(bencodedValue).value;
    } else {
        throw new Error("Only strings/numbers/lists are supported at the moment");
    }
}

function main() {
    const command = process.argv[2];

    if (command === "decode") {
        const bencodedValue = process.argv[3];

        console.log(JSON.stringify(decodeBencode(bencodedValue)));
    } else {
        throw new Error(`Unknown command ${command}`);
    }
}

main();
