import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

async function generateAIContent(prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
    
   Examples: 

    <example>
 
    response: {

    "text": "this is you fileTree structure of the express server",
   "fileTree": {
    "package.json": {
            file: {
                contents: "

                {
                    "name": "express-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
                }

                
                "
                
                

            },

        },
        "app.js": {
            file: {
                contents: "
                const express = require('express');

                const app = express();


                app.get('/', (req, res) => {
                    res.send('Hello World!');
                });


                app.listen(3000, () => {
                    console.log('Server is running on port 3000');
                })
                "
            
        },
    },

       

    },
    "buildCommand": {
        mainItem: "npm",
            commands: [ "install" ]
    },

    "startCommand": {
        mainItem: "node",
            commands: [ "app.js" ]
    }
}

    user:Create an express application 
   
    </example>


    
       <example>

       user:Hello 
       response:{
       "text":"Hello, How can I help you today?"
       }
       
       </example>
    
 IMPORTANT : don't use file name like routes/index.js
 IMPORTANT: Always include a "package.json" file at the root of the fileTree. Do not nest it inside any folder
       
       
    `,
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
  
    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
}

export default generateAIContent;
