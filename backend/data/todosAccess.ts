import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../src/utils/logger'
import { TodoItem } from '../src/models/TodoItem'
import { TodoUpdate } from '../src/models/TodoUpdate';

const AWSXRay = require('aws-xray-sdk-core')
const XAWS = AWSXRay.captureAWS(AWS)


// TODO: Implement the dataLayer logic
export class TodosAccess{
    constructor(
        private readonly documentClient : DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIndex = process.env.TODOS_CREATED_AT_INDEX,
        private logger = createLogger('auth')
    ){}

    async createTodoItem(todoItem: TodoItem): Promise<TodoItem>{
        this.logger.info('creating new todo', {
            todo: JSON.stringify(todoItem)
            })
        await this.documentClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise()

        return todoItem;
    }

    async getAllTodos(userId:string): Promise<TodoItem[]>{
        this.logger.info('getting all todos', {
            userId: userId
            })
        const res = await this.documentClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues:{
                ':userId' : userId
            }
        }).promise()
        const todos = res.Items as TodoItem[]
        return todos
    }

    async updateTodoItem(todoId:string,userId:string,todoUpdate:TodoUpdate):Promise<TodoUpdate>{
        this.logger.info('updating todo', {
            todo: JSON.stringify(todoUpdate)
            })
        await this.documentClient.update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues:{
                ':name' : todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done':todoUpdate.done
            },
            ExpressionAttributeNames:{
                '#name':'name'
            },
            ReturnValues:'ALL_NEW'
        }).promise()

        return todoUpdate
    }

    async deleteTodoItem(todoId:string,userId:string):Promise<string>{
        this.logger.info('removing todo', {
            todo: (todoId)
            })
        await this.documentClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        }).promise()

        return todoId
    }

    async updateTodoAttachmentUrl(todoId:string,userId:string,attachmentUrl:string):Promise<void>{
        this.logger.info('updating todo attachment', {
            todo: JSON.stringify(attachmentUrl)
            })
        await this.documentClient.update({
            TableName: this.todosTable,
            Key:{
                todoId,
                userId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues:{
                ':attachmentUrl':attachmentUrl
            }
        }).promise()
    }
}