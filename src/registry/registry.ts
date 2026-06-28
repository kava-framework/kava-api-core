export interface RedisService {
  get(key: string)                                :  Promise<string | null>;
  setex(key: string, ttl: number, value: string)  :  Promise<any>;
  del(key: string | string[])                     :  Promise<any>;
  [key: string]                                   :  any;
}

export interface QueueService {
  add(name: string, data: any, options?: any)  :  Promise<any>;
  [key: string]                                :  any;
}

export interface Registry {
  redis          ?:  RedisService;
  queue          ?:  QueueService;
  [key: string]   :  any;
}



class ServiceRegistry {
  private services: Registry = {};

  // =====================================>
  // ## Registry: register a service
  // =====================================>
  register<K extends keyof Registry>(name: K, service: Registry[K]): void {
    this.services[name] = service;
  }

  // =====================================>
  // ## Registry: get a registered service
  // =====================================>
  get<K extends keyof Registry>(name: K): Registry[K] {
    return this.services[name];
  }
}

export const registry = new ServiceRegistry();
