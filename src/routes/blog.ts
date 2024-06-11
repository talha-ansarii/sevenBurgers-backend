import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { getCookie, getSignedCookie, setCookie, setSignedCookie, deleteCookie } from 'hono/cookie'


export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
      JWT_SECRET : string
    },
    
  }>()




  blogRouter.use("/*", async (c, next) => {
    const token =  getCookie(c, 'token')
    if (token === "" || !token) {
		c.status(401);
		return c.json({ 
            success: false,
            error: "unauthorized" });
	}
    

      const decodedPayload = await verify(token, c.env.JWT_SECRET)

    if (!decodedPayload) {
        return c.json({ message: "Not Authenticated!" }, 401);

      }
      await next()

    

  })
  

  blogRouter.post('/', async (c) => {
    const body = await c.req.json();

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    const blog = await prisma.post.create({
        data : {
            title : body.title,
            content : body.content,
            images : body.images,

        }
    })

    return c.json({
        success : true,
       id : blog.id
    })
  })


  blogRouter.put('/', async (c) => {

    const body = await c.req.json();

  
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.post.update({
        where: {
            id: body.id,
          },
        data : {
            title : body.title,
            content : body.content,
            images : body.images,
            

        }
    })
    return c.json({
        success : true,
        id :blog.id
    })
  })



  blogRouter.get('/bulk', async (c) => {

    // console.log("from bulk")
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    try {
        const blogs = await prisma.post.findMany()

        return c.json({
            success : true,
            blogs:blogs
        })
        
    } catch (error) {
        c.status(411)
        return c.json({
            success : false,
            message : "error while finding blogs"
        })
    }
    
    
  })

  blogRouter.get('/:id', async (c) => {

    const id = c.req.param("id")
    
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    try {
        const idNumber = Number(id);

        if (isNaN(idNumber)) {
        throw new Error("ID must be a number");
    }
        const blog = await prisma.post.findFirst({
            where: {
                id: idNumber,
              }  
        })

        return c.json({
            blog : blog,
            success : true
        })
        
    } catch (error) {
        c.status(411)
        return c.json({
            success : false,
            message : "error while finding blog"
        })
    }
    
    
  })







