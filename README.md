# AWS Lambda: Serverless API
***

- [Intro](#intro)
- [Serverless Functions](#serverless-functions)
- [Test Events](#test-events)
- [Function URL](#function-url)
- [AWS API Gateway](#aws-api-gateway)
- [AWS IAM](#aws-iam)
- [MongoDB](#mongodb)
- [Connecting MongoDB to AWS Lambda](#connecting-mongodb-to-aws-lambda)

***

## Intro

AWS Lambda is a serverless computing service provided by AWS. It allows you to run code  without provisioning or managing servers. You simply upload your code, and Lambda automatically scales & manages the execution of your code. We will be wrapping our API server as a serverless function, and managing requests to our database using AWS Lambda.

Express servers aren't built to run on serverless, and the whole point of Lambda is that it's a serverless function, so we will have to make modifications to fit the Lambda format. We accomplish that by using a library called `serverless-http`.

Look inside of the folder `example1`. Inside this folder, you'll find a file called `index.mjs` (no, this is not a typo). This is an example of the format AWS will be expecting of a Node.js function. The root of the application must export something called a `handler`, and this function is what runs when you perform an HTTP request to Lambda. We can export an entire server this way!

## Serverless Functions

Before deploying your app, select all of the files inside of your project folder and compress them into a `.zip` file. Once you have it prepared, follow these steps to create your first serverless function:

1. Open the AWS Management Console and navigate to the Lambda service.

2. Click on the "Create Function` button

3. Choose "Author from scratch"

4. Give this function a name, any name

5. Configure the runtime to Node.js 18.x

6. Scroll to the bottom and click the "Create function" button.

7. On this next screen, scroll down and select the "Code" tab to see the source code. Click the "Upload from" file and select ".zip file" from the dropdown

8. Click "Upload" and select the `.zip` file you created earlier.

### Test Events

1. Inside the Lambda function console, click on the dropdown for the "Test" button. Select "Configure test events" from the dropdown

2. In the "Event name" field, you can give this test any kind of name. The "Event JSON" section shows the body of the test request.

3. Click "Save" at the bottom.

4. After clicking the "Test" button now, a pretend request will be sent to this function, and a tab that says "Execution results" will show in the code editor. This will show the response to the request.

### Function URL

When doing this on your own, in your project folder, make sure to run the following command to install the proper library we need to export our server:

`npm install serverless-http`

Using the terminal, navigate into the `example2` folder. In here, there is a small module that generates random data. The `package.json` file should already contain the modules we need, so you can just use `npm install` to get the `node_modules/` folder, because we will need it. 

1. In the Lambda function console, go to the "Configuration" tab.

2. Go to the function URL in the side menu. Click "Create function URL".

3. Select None in the Auth Type and click "Save".

4. After that, you can get the function URL from the "Confguration" tab or in the Function Overview.

5. Take this URL to Postman and perform a GET request. You should see the results here, which tells us that this URL works from anywhere!

## AWS API Gateway

We have a URL! Next is to apply an API Gateway as a security measure. To do this, scroll up to the top of this function's page and click the "Add Trigger" button in the Diagram. 

In the trigger configuration dropdown menu you'll select "API Gateway". From here, select "Create an API" and for the type, choose "HTTP API. For security, select "Open" for now. Finally, select "Add" to create our API Gateway.

Using the terminal, navigate into the `example3` folder and use command `npm install`. Make sure to test first that this server works locally using command `node index.js` and making requests to `localhost:3001` && `localhost:3001/test`.

Once we have our folder zipped up, it's time to upload it. Navigate to the "Code Source" section of your AWS Lambda serverless function and click on the "Upload from" button in the top right section and select ".zip file". Once the function has the new code, test it a few times! Make sure to try `/test` as well, which shows that all routes will respond accordingly.

## AWS IAM

Now that we know that modules will work and our routes will stay in place, we can make a secure connection between Lambda and MongoDB using AWS IAM. 

1. In the AWS console, search for Identity and Access Management (IAM) and select it.

2. Select "Roles" from the side menu and select "Create role".

3. Select "AWS service" as the trusted entity, and then select "Lambda". Click "Next: Permissions".

4. Under "Permissions policies", search for AmazonAPIGatewayInvokeFullAccess. This is an AWS managed permission and should stay up-to-date automatically. Select it and click "Next: Review".

5. Give the role a name (e.g., LambdaMongoDBAccessRole), and add a description if desired. Review the role and select "Create role".

6. View the role you just created, and note the ARN in the Summary. We will be using it in the next section, MongoDB.

7. While viewing the role, scroll down to Permissions policies and select the "Add permissions" dropdown, and select "Create inline policy".

8. Select JSON instead of Visual, and make sure you add the following to the statement:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::<YOUR_ARN_CODE>:role/LambdaMongoDBAccessRole"
    }
  ]
}
```

Replace the `"Resource"` value with the ARN associated with this role and select "Next"

9. Give the Policy name something like "stsAssumeRole" and select "Create policy"

10. While viewing the IAM Role, select the "Trust relationships" tab below the Summar, and select "Edit trust policy". Make sure the statement appears there as well:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Principal": {
				"Service": "lambda.amazonaws.com",
				"AWS": [
                "arn:aws:iam::<YOUR_ARN_CODE>:role/LambdaMongoDBAccessRole",
                "arn:aws:sts::552010969569:assumed-role/testFunction-role-24q8vyws/testFunction"
                ]
			},
			"Action": "sts:AssumeRole"
		}
	]
}
```

Replace the `<YOUR_ARN_CODE>` value with the ARN number associated with this role and select "Update Policy"

## MongoDB

Generating fake data is fine, but let's step our game up and serve real movie data. For this, we'll need access to a database that has real data we can use. [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) has multiple free datasets that we can utilize and one of them just happens to be a movie dataset.

### Database User

We can use the same `Cluster0` we've been using, or you can choose to generate a new cluster (this will take a few minutes) dedicated to AWS usage. In either case, we should made a new Database User who's permissions can be aligned with AWS. 

1. On the left side menu, under Security select "Database Access"

2. Selet "ADD NEW DATABASE USER"

3. For the Authentication Method, select "AWS IAM"

4. Make sure the AWS IAM Type is IAM Role. Paste in the ARN code from the previous section

5. Under Database User Privileges, assign it the Built-in Role "Atlas admin". Then select "Add User". 

### Sample Dataset

Once the MongoDB Database User is created, let's head back to the Cluster and create a dataset to test with. 

1. On the left side menu, under Deployment select "Database"

2. Click on the `...` button in your cluster and select the Load Sample Dataset option. Confirm in the modal that you want to load the data and the sample dataset will be loaded.

3. It will take a while to load the entire thing, but you can check MongoDB Compass and keep refreshing the databases until you see the `sample_mflix` database with the `movies` collection. If you see it available, it's ready to be tested!

## Connecting MongoDB to AWS Lambda

Now we finally test the connection, and assure that Lambda can access our database. 

In terminal, navigate into the `example4` folder. Use `npm install` to install all needed dependencies and generate the `node_modules`. When trying this for your own server, make sure to use the following modules:

- `aws-sdk`
- `dotenv`
- `express`
- `mongoose`
- `serverless-http`

Next, generate a `.env` file, and copy from the `.env.template`. Replace the `<cluster-name>.<cluster-code>` with those parts from your connection string.

After that, make sure you are able to package the `.env` into your `.zip` file when you compress it.

- On Windows, ensure hidden files are visible in this folder.
- On Mac, press `Command + Shift + .` to toggle hidden files visibility.

Select all necessary files (`.env`, `index.js`, `node_modules`, `package.json`, `package-lock.json`) and compress them into a `.zip` file.

> [!WARNING]
> Internal testing on AWS works, testing through Postman fails. Until it works on Postman, it cannot work as an API accessible from the front-end of your application