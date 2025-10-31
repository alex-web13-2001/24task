import nodemailer from 'nodemailer';

// Создание транспорта для отправки email
const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true для 465, false для других портов
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Отправка email для подтверждения регистрации
export const sendVerificationEmail = async (email, name, token) => {
  const transporter = createTransport();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Подтверждение регистрации в Task24',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Добро пожаловать в Task24, ${name}!</h2>
        <p>Спасибо за регистрацию. Пожалуйста, подтвердите ваш email, перейдя по ссылке ниже:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Подтвердить email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Если вы не регистрировались в Task24, просто проигнорируйте это письмо.
        </p>
        <p style="color: #666; font-size: 14px;">
          Ссылка действительна в течение 72 часов.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email подтверждения отправлен на ${email}`);
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    throw new Error('Не удалось отправить email');
  }
};

// Отправка email для восстановления пароля
export const sendPasswordResetEmail = async (email, name, token) => {
  const transporter = createTransport();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Восстановление пароля Task24',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Восстановление пароля</h2>
        <p>Здравствуйте, ${name}!</p>
        <p>Вы запросили восстановление пароля. Перейдите по ссылке ниже, чтобы создать новый пароль:</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Восстановить пароль
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
        </p>
        <p style="color: #666; font-size: 14px;">
          Ссылка действительна в течение 72 часов.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email восстановления пароля отправлен на ${email}`);
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    throw new Error('Не удалось отправить email');
  }
};

// Отправка приглашения в проект
export const sendProjectInvitation = async (email, projectName, inviterName, role, token) => {
  const transporter = createTransport();
  const invitationUrl = `${process.env.FRONTEND_URL}/invitation?token=${token}`;
  
  const roleNames = {
    Collaborator: 'Соавтор',
    Member: 'Участник',
    Viewer: 'Наблюдатель'
  };
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Приглашение в проект "${projectName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Приглашение в проект</h2>
        <p>${inviterName} приглашает вас присоединиться к проекту <strong>"${projectName}"</strong></p>
        <p>Ваша роль: <strong>${roleNames[role]}</strong></p>
        <p style="margin: 30px 0;">
          <a href="${invitationUrl}" style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Принять приглашение
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ссылка действительна в течение 72 часов.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Приглашение отправлено на ${email}`);
  } catch (error) {
    console.error('❌ Ошибка отправки приглашения:', error);
    throw new Error('Не удалось отправить приглашение');
  }
};
