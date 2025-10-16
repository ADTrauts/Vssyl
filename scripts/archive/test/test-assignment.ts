import express from 'express'; const req: express.Request = {} as any; const currentUser = req.user; console.log(currentUser?.id);
