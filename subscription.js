const jsonfile = require('jsonfile');

module.exports = class subscription {
    constructor() {
        this.filePath = './subscriptions/subscription.json';
        this.subscription = this.read();
    }

    save(obj) {
        jsonfile.writeFile(this.filePath, obj, { spaces: 2 }, function(err) {
            if (err) {
                console.error(err);
            }
        });
    }

    get(memberId) {
        if (!memberId || !this.subscription) {
            console.log('empty memberId');
            return null;
        }
        return this.subscription[memberId] ? this.subscription[memberId] : null;
    }

    read() {
        const objSubscription = jsonfile.readFileSync(this.filePath);
        return objSubscription;
    }

    update(memberId, strSubscription) {
        if (memberId in this.subscription) {
            this.subscription[memberId] = strSubscription;
        } else {
            if (strSubscription && memberId) {
                this.subscription[memberId] = strSubscription;
            }
        }
        this.save(this.subscription);
    }
};