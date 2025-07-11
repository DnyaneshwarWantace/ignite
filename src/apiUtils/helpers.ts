import axios from "axios";

export const convertURLSearchParamsToObject = (
  searchParams: URLSearchParams
) => {
  let obj: any = {};
  searchParams.forEach((value: any, key: any) => {
    obj[key] = value;
  });
  return obj;
};

export const makeId = (length: number) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  return result;
};

export const sendEmail = async (
  receiver_email: string,
  email_subject: string,
  email_body: string
) => {
  if (
    process.env.MAILERSEND_ENABLED == "false" ||
    process.env.SEND_EMAILS == "false"
  )
    return false;

  try {
    const response = await axios.post(
      "https://api.mailersend.com/v1/email",
      {
        from: {
          email: process.env.MAILERSEND_DEFAULT_SENDER_EMAIL,
          name: "Alertproxies",
        },
        to: [
          {
            email: receiver_email,
            name: receiver_email,
          },
        ],
        subject: email_subject,
        text: email_body,
        html: email_body,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
        },
      }
    );

    console.log(response);
  } catch (err) {
    console.log(err);
  }
};
