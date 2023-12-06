export const accountData = [
  {
    email: 'sravanthi.com',
    name: 'sravanthi',
    company: 'cognine',
    phoneNumber: '987654',
    password: '1234567890',
    confirmPassword: '1234567',
  },
]

export const optionalDetailsWithFirstValueNull = [
  {
    email: 'sravanthi.gorantla@gmail.com',
    name: 'sravanthi',
    company: 'cognine',
    phoneNumber: '9876543210',
    password: '1234567890',
    confirmPassword: '1234567890',
    workDetails: [
      {
        addressLabel: 'test1',
        commodity: 'food',
      },
    ],
    inviteTeam: [
      {
        workerId: '13245',
        type: 'Operator',
      },
    ],
  },
]

export const optionalDetailsWithSecondValueNull = [
  {
    email: 'sravanthi.gorantla@gmail.com',
    name: 'sravanthi',
    company: 'cognine',
    phoneNumber: '9876543210',
    password: '1234567890',
    confirmPassword: '1234567890',
    workDetails: [
      {
        address: '1200',
        commodity: 'food',
      },
    ],
    inviteTeam: [
      {
        email: 'sravanthi@gmail.com',
        type: 'Operator',
      },
    ],
  },
]
