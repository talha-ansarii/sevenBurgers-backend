import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import {   verify } from 'hono/jwt'
import { getCookie    } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import {parse} from 'flatted'
export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
      JWT_SECRET : string
    },
    Variables : {
        userId : string
    }
    
  }>()



// Middleware

const authMiddleware = createMiddleware( async (c, next) => {
    console.log("from middleware")
    const jwt = c.req.header('Authorization') || "";

    console.log(jwt)
	if (jwt === "" || !jwt) {
		c.status(401);
		return c.json({ 
            success: false,
            error: "unauthorized" });
	}
	const token = jwt.split(' ')[1];

    try {
        const user = await verify(token , c.env.JWT_SECRET);
    // console.log(user)
    if(user){
        c.set("userId" , user.id)
        await next();
    }else{
        c.status(403)
        return c.json({
            success : false,
            message : "you are not logged in"
        })  
    }
        
    } catch (error) {
        c.status(403)
        return c.json({
            success : false,
            message : "you are not logged in"
        })
        
    }
    

  })


  

//   Create Blog
  blogRouter.post('/',authMiddleware, async (c) => {
    const body = await c.req.json();
    
    console.log(body)
    
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    const blog = await prisma.post.create({
        data : {
            title : body.title,
            content : body.content,
            images : body.images,
            blogNo : body.blogNo,

        }
    })

    return c.json({
        success : true,
       id : blog.id
    })
  })


//   Update Blog
  blogRouter.put('/',authMiddleware, async (c) => {

    const body = await c.req.json();

    console.log(body)

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
            createdAt: new Date(),
            

        }
    })
    return c.json({
        success : true,
        id :blog.id
    })
  })


  blogRouter.get('/allblogs', async (c) => {
    console.log("from all blogs")


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


// Get blogs for pagination
blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const page = Number(c.req.query('page') || '1');
    const pageSize = Number(c.req.query('pageSize') || '3');
    const skip = (page - 1) * pageSize;

    try {
        const blogs = await prisma.post.findMany({
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
        });

        const totalBlogs = await prisma.post.count();

        return c.json({
            success: true,
            blogs,
            totalBlogs,
            totalPages: Math.ceil(totalBlogs / pageSize),
            currentPage: page
        });

    } catch (error) {
        c.status(411)
        return c.json({
            success: false,
            message: "error while finding blogs"
        });
    }
});


//   Get Blog by ID
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

  // Delete Blog
    blogRouter.delete('/:id',authMiddleware, async (c) => {
    
        const id = c.req.param("id")
        
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
    
        try {
            const idNumber = Number(id);
    
            if (isNaN(idNumber)) {
            throw new Error("ID must be a number");
        }
            const blog = await prisma.post.delete({
                where: {
                    id: idNumber,
                }  
            })
    
            return c.json({
                success : true,
                id : blog.id
            })
            
        } catch (error) {
            c.status(411)
            return c.json({
                success : false,
                message : "error while deleting blog"
            })
        }
        
        
    })


    //search blog
    blogRouter.get('/search/:query', async (c) => {
        const query = c.req.param("query")

        console.log(query)
        
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
    
        try {
            const blogs = await prisma.post.findMany({
                where: {
                    OR: [
                        {
                            title: {
                                contains: query,
                                mode: 'insensitive'
                            }
                        },    
                    ]
                }
            })
    
            return c.json({
                success : true,
                blogs
            })
            
        } catch (error) {
            c.status(411)
            return c.json({
                success : false,
                message : "error while searching blog"
            })
        }
        
        
    })








