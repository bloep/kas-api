export class APIResultTransformer {
    public static transform(orgObj: any): object | any[] {
        if (typeof orgObj !== "object") {
            return orgObj;
        }

        const obj = this._flatKeyValueArr(orgObj);

        if (Array.isArray(orgObj)) {
            const newArr = [];
            for (const value of Object.values(obj)) {
                newArr.push(this.transform(value));
            }
            return newArr;
        } else {
            if (Object.values(obj).length === 1) {
                return this.transform(Object.values(obj)[0]);
            }
            const newObj: IGenericObject = {};
            for (const key of Object.keys(obj)) {
                newObj[key] = this.transform(obj[key]);
            }

            return newObj;
        }
    }

    private static _flatKeyValueArr(orgObj: any) {
        const keys = Object.keys(orgObj);
        if (!Array.isArray(orgObj) && keys.length === 1 && keys.includes("item")) {
            const obj = orgObj.item;
            if (Array.isArray(obj) && obj.every((v) => {
                const objKeys = Object.keys(v);
                return objKeys.length === 2 && objKeys.includes("key") && objKeys.includes("value");
            })) {
                const newObj: IGenericObject = {};

                for (const v of obj) {
                    newObj[v.key] = v.value;
                }
                return newObj;
            }
        }
        return orgObj;
    }
}

interface IGenericObject {
    [key: string]: any;
}
