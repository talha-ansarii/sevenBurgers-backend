import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { getCookie, getSignedCookie, setCookie, setSignedCookie, deleteCookie } from 'hono/cookie'



async function hashPassword(password : string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashedPassword;
}

async function comparePasswords(inputPassword : string, storedHashedPassword : string) {
  const hashedInputPassword = await hashPassword(inputPassword);
  return hashedInputPassword === storedHashedPassword;
}



export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
      JWT_SECRET : string
    }
  }>();

userRouter.post('/signup',async (c) => {

  const prisma = new PrismaClient({
    datasourceUrl: c?.env?.DATABASE_URL,
}).$extends(withAccelerate())

const body = await c.req.json()
const { username, email, password } = body



try {
  const hashedPassword = await hashPassword(password);
  console.log(hashedPassword);

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  console.log(newUser);

  return c.json({ message: "User created!" }, 201);
} catch (err) {


  console.log(err);

  return c.json({ message: "Error creating user!" }, 500);
}

})



userRouter.post('/signin',async (c) => {

  const prisma = new PrismaClient({
    datasourceUrl: c?.env?.DATABASE_URL,
}).$extends(withAccelerate())

const body = await c.req.json()
  const { email, password } = body;
  console.log(email, password)

  
try {

  const user = await prisma.user.findUnique({
      where : {
          email : email
      }
  })

  console.log(user)

  const {password : userPassword , ...userInfo} = user || {};
  
  if(!user){
    return c.json({ message: 'Invalid Credentials!' }, 401);
  }

  const isPasswordCorrect = await comparePasswords(password, userPassword || "")
  console.log(isPasswordCorrect)

  if(!isPasswordCorrect){
    return c.json({ message: 'Invalid Credentials!' }, 401);

  }

  // res.setHeader("Set-Cookie", "test=" + "myValue" ).json("sucess")
  const age = 60 * 60 * 24 * 7;

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);
  
  setCookie(c, 'token', token , {
    httpOnly : true,
    // secure : true,
    maxAge : age,
    
})
return c.json({message : "Logged in!" , user : userInfo})

  

} catch (err) {
  console.log(err);
  return c.json({ message: "Error logging in!" }, 500);

}


});


userRouter.post('/signout', async (c) => {
  deleteCookie(c, "token")
  return c.json({message : "signed out successfully"})
})