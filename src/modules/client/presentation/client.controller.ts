import { Controller, Get } from "@nestjs/common";

@Controller("Client")
export class ClientController {

    @Get()
    async Get(): Promise<string> {
        return "hello word"
    }
}