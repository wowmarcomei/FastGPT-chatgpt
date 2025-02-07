import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase } from '@/service/mongo';
import { authToken } from '@/service/utils/auth';
import { ModelDataSchema } from '@/types/mongoSchema';
import { generateVector } from '@/service/events/generateVector';
import { PgClient } from '@/service/pg';
import { authModel } from '@/service/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { modelId, data } = req.body as {
      modelId: string;
      data: { a: ModelDataSchema['a']; q: ModelDataSchema['q'] }[];
    };
    const { authorization } = req.headers;

    if (!authorization) {
      throw new Error('无权操作');
    }

    if (!modelId || !Array.isArray(data)) {
      throw new Error('缺少参数');
    }

    // 凭证校验
    const userId = await authToken(authorization);

    await connectToDatabase();

    // 验证是否是该用户的 model
    await authModel({
      userId,
      modelId
    });

    // 插入记录
    await PgClient.insert('modelData', {
      values: data.map((item) => [
        { key: 'user_id', value: userId },
        { key: 'model_id', value: modelId },
        { key: 'q', value: item.q },
        { key: 'a', value: item.a },
        { key: 'status', value: 'waiting' }
      ])
    });

    generateVector();

    jsonRes(res, {
      data: 0
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
