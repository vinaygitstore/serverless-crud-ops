const db = require("./db");
const _ = require('lodash');
const {
    GetItemCommand,
    PutItemCommand,
    DeleteItemCommand,
    ScanCommand,
    UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const getUser = async (event) => {
    const response = { statusCode: 200 };

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ userId: event.pathParameters.userId }), 
        };
        const { Item } = await db.send(new GetItemCommand(params));
        const data = unmarshall(Item);
        if(!_.isEmpty(data.userId)) {
            response.body = JSON.stringify({
                message: `Data retrieved successfully for user ${data.userId}`,
                data
            });
        } else {
            response.body = JSON.stringify({
                message: `Data not available for ${data.userId}`
            })
        }
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const createUser = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        if(!_.isEmpty(body.userId) && !_.isEmpty(body.email) && !_.isEmpty(body.phone) && !_.isEmpty(body.firstName) && !_.isEmpty(body.lastName)){
            const params = {
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: marshall(body || {}),
            };
            const createResult = await db.send(new PutItemCommand(params));
    
            response.body = JSON.stringify({
                message: "Successfully created post.",
                createResult,
            });
        } else {
            response.body = JSON.stringify({
                message: "Manadatory fields are missing , please post data with all required fields including userId , email, phone, firstName and lastName",
            });
        }
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to create post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const updateUser = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        const objKeys = Object.keys(body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ userId: event.pathParameters.userId }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: body[key],
            }), {})),
        };
        const updateResult = await db.send(new UpdateItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully updated post.",
            updateResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to update post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const deleteUser = async (event) => {
    const response = { statusCode: 200 };

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ userId: event.pathParameters.userId }),
        };
        const deleteResult = await db.send(new DeleteItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully deleted post.",
            deleteResult,
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to delete post.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

const getAllUsers = async () => {
    const response = { statusCode: 200 };

    try {
        const { Items } = await db.send(new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME }));

        response.body = JSON.stringify({
            message: "Successfully retrieved all posts.",
            data: Items.map((item) => unmarshall(item)),
        });
    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve posts.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
};

module.exports = {
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getAllUsers,
};
