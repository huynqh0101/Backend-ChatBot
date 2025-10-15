import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";
import { isArray } from "class-validator";


export const GetUser = createParamDecorator(
    (data, ctx: ExecutionContext) => { 

        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        if (!user && (!data || data.required !== false)) {
          throw new InternalServerErrorException('Missed user');
        }
        if (!user && data && data.required === false) {
          return null;
        }

        if (data && typeof data === 'object' && !isArray(data)) {
          // Trường hợp truyền object như { required: false }
          return user;
        }

        if (data) {
            if (isArray(data)) {
                let userData = {};
                data.forEach(param => {
                   userData[param] = user[param];
                });
                return userData;
            }
            return user[data];
        }

        return user;

     }
);