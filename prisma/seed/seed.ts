import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';


const prisma = new PrismaClient();

async function main() {
  const bcpass = bcryptjs.hashSync('123456', 10);

  // Delete old data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@example.com',
      password: bcpass,
      role: 'admin',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: bcpass,
      role: 'user',
    },
  });

  // Danh sách 17 chủ đề và nội dung chat thực tế
  const conversationsData = [
    { title: 'Chào buổi sáng', messages: ['Chào buổi sáng!', 'Chào bạn, chúc bạn một ngày tốt lành!'] },
    { title: 'Hỏi về sản phẩm A', messages: ['Sản phẩm A còn hàng không?', 'Dạ còn, bạn muốn mua mấy cái ạ?'] },
    { title: 'Đặt hàng sản phẩm B', messages: ['Tôi muốn đặt 2 sản phẩm B.', 'Bạn vui lòng cung cấp địa chỉ nhận hàng nhé.'] },
    { title: 'Hủy đơn hàng', messages: ['Tôi muốn hủy đơn hàng #123.', 'Bạn xác nhận giúp mình lý do hủy nhé.'] },
    { title: 'Bảo hành sản phẩm', messages: ['Sản phẩm bị lỗi thì bảo hành thế nào?', 'Bạn gửi ảnh sản phẩm giúp mình nhé.'] },
    { title: 'Thanh toán', messages: ['Có thể thanh toán qua ví điện tử không?', 'Bên mình hỗ trợ Momo và ZaloPay nhé.'] },
    { title: 'Giao hàng', messages: ['Bao lâu thì nhận được hàng?', 'Khoảng 2-3 ngày bạn nhé.'] },
    { title: 'Đổi trả', messages: ['Tôi muốn đổi sản phẩm bị lỗi.', 'Bạn vui lòng cho biết lý do đổi trả.'] },
    { title: 'Khuyến mãi', messages: ['Có chương trình khuyến mãi nào không?', 'Hiện tại đang có giảm giá 10%.'] },
    { title: 'Tư vấn chọn sản phẩm', messages: ['Tôi cần tư vấn chọn laptop.', 'Bạn thích dùng hãng nào, mình tư vấn nhé.'] },
    { title: 'Hỗ trợ kỹ thuật', messages: ['Máy tính không lên nguồn.', 'Bạn thử kiểm tra lại dây nguồn giúp mình nhé.'] },
    { title: 'Cảm ơn', messages: ['Cảm ơn bạn đã hỗ trợ.', 'Rất vui được phục vụ bạn.'] },
    { title: 'Phản hồi dịch vụ', messages: ['Tôi muốn góp ý về dịch vụ.', 'Bạn cứ chia sẻ ý kiến nhé.'] },
    { title: 'Đăng ký tài khoản', messages: ['Làm sao để đăng ký?', 'Bạn vào trang đăng ký và điền thông tin nhé.'] },
    { title: 'Quên mật khẩu', messages: ['Tôi quên mật khẩu.', 'Bạn dùng chức năng quên mật khẩu để lấy lại nhé.'] },
    { title: 'Thông tin cửa hàng', messages: ['Cửa hàng ở đâu?', 'Bên mình ở 123 Đường ABC, Quận 1.'] },
    { title: 'Liên hệ', messages: ['Số điện thoại liên hệ là gì?', 'Bạn gọi 0123 456 789 nhé.'] },
  ];

  // Tạo 17 conversation và 2 message cho mỗi conversation
  for (const conv of conversationsData) {
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: conv.title,
      },
    });
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'user',
          content: conv.messages[0],
        },
        {
          conversationId: conversation.id,
          role: 'admin',
          content: conv.messages[1],
        },
      ],
    });
  }

  console.log('English seed data inserted!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
