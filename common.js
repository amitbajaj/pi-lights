
function genString(num){
    if(num==0){
        return ""
    }else{
        return genString(Math.floor(num/2)) + "" + (num%2)
    }
}

function num2bin(num,sz) {
    switch(sz){
        case 4:
            if(num>15){
                return "1111"
            }else{
                sVal = ("0000" + genString(num))
                return sVal.substr(sVal.length-4)
            }
            break;
        case 8:
            if(num>255){
                return "11111111"
            }else{
                sVal = ("00000000" + genString(num))
                return sVal.substr(sVal.length-4)
            }
            break;
        default:
            return ""
    }
}

exports.num2bin = num2bin;
//exports.genString = genString;
