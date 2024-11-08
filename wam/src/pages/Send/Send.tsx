import { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react'
import {
  VStack,
  HStack,
  Button,
  Text,
  Icon,
  ButtonGroup,
} from '@channel.io/bezier-react'
import { CancelIcon, SendIcon } from '@channel.io/bezier-icons'

import {
  callFunction,
  callNativeFunction,
  getWamData,
  setSize,
} from '../../utils/wam'
import * as Styled from './Send.styled'

function Send() {
  useEffect(() => {
    setSize(390, 172)
  }, [])

  const chatTitle = useMemo(() => getWamData('chatTitle') ?? '', [])

  const appId = useMemo(() => getWamData('appId') ?? '', [])
  const channelId = useMemo(() => getWamData('channelId') ?? '', [])
  const managerId = useMemo(() => getWamData('managerId') ?? '', [])
  const message = useMemo(() => getWamData('message') ?? '', [])
  const chatId = useMemo(() => getWamData('chatId') ?? '', [])
  const chatType = useMemo(() => getWamData('chatType') ?? '', [])
  const broadcast = useMemo(() => Boolean(getWamData('broadcast') ?? false), [])
  const rootMessageId = useMemo(() => getWamData('rootMessageId'), [])

  const [option, setOption] = useState<number>(0)
  const [inputNum, setinputNum] = useState('')
  const [selectedOption, setSelectedOption] = useState('오늘')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setinputNum(e.target.value)
  }

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value)
  }

  const getTimeStamp = useCallback(() => {
    const millisecondsInADay = 24 * 60 * 60 * 1000 // 하루의 밀리초
    const endValue = Date.now()
    let startValue
    if (selectedOption === '0') {
      const now = new Date()
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime()
      startValue = endValue - startOfDay
    } else {
      startValue = endValue - millisecondsInADay * Number(selectedOption)
    }
    return [startValue, endValue]
  }, [selectedOption])

  const handleSend = useCallback(
    async (sender: string): Promise<void> => {
      if (chatType === 'group') {
        switch (sender) {
          case 'bot':
            await callFunction(appId, 'sendAsBot', {
              input: {
                groupId: chatId,
                broadcast,
                rootMessageId,
              },
            })
            break
          case 'manager':
            await callNativeFunction('writeGroupMessageAsManager', {
              channelId,
              groupId: chatId,
              rootMessageId,
              broadcast,
              dto: {
                plainText: message,
                managerId,
              },
            })
            break
          case 'hello':
            await callFunction(appId, 'hello', {
              input: {
                groupId: chatId,
                broadcast,
                rootMessageId,
              },
            })
            break
          case 'summarizeN':
            await callFunction(appId, 'summarize', {
              input: {
                groupId: chatId,
                personId: managerId,
                flag: 0,
                mesgNum: inputNum,
              },
            })
            break
          case 'summarizeD':
            await callFunction(appId, 'summarize', {
              input: {
                groupId: chatId,
                personId: managerId,
                flag: 1,
                startTime: getTimeStamp()[0],
                endTime: getTimeStamp()[1],
              },
            })
            break
          default:
            // NOTE: should not reach here
            console.error('Invalid message sender')
        }
      } else if (chatType === 'directChat') {
        // FIXME: Implement
      } else if (chatType === 'userChat') {
        // FIXME: Implement
      }
    },
    [
      appId,
      broadcast,
      channelId,
      chatId,
      chatType,
      managerId,
      message,
      rootMessageId,
      inputNum,
      getTimeStamp,
    ]
  )

  return (
    <VStack spacing={16}>
      <HStack justify="between">
        <Text
          color="txt-black-darkest"
          typo="24"
          bold
        >
          Summarize
        </Text>
        <Button
          colorVariant="monochrome-dark"
          styleVariant="tertiary"
          leftContent={CancelIcon}
          onClick={() => close()}
        />
      </HStack>
      {option === 0 ? (
        <HStack justify="center">
          <ButtonGroup>
            <Button
              colorVariant="blue"
              styleVariant="primary"
              text="최신 N개 메시지 요약"
              onClick={() => setOption(1)}
            />
            <Button
              colorVariant="blue"
              styleVariant="primary"
              text="시작 일시부터 지금까지 메시지 요약"
              onClick={() => setOption(2)}
            />
          </ButtonGroup>
        </HStack>
      ) : option === 1 ? (
        <HStack>
          <input
            type="number"
            value={inputNum}
            onChange={handleChange}
            placeholder="숫자를 입력하세요"
          />
          <Button
            colorVariant="blue"
            styleVariant="primary"
            text="요약"
            onClick={async () => {
              await handleSend('summarizeN')
              close()
            }}
          />
        </HStack>
      ) : option === 2 ? (
        <HStack>
          <select
            value={selectedOption}
            onChange={handleSelectChange}
          >
            <option
              value="0"
              selected
            >
              오늘
            </option>
            <option value="3">3일</option>
            <option value="5">5일</option>
            <option value="7">7일</option>
          </select>
          <Button
            colorVariant="blue"
            styleVariant="primary"
            text="요약"
            onClick={async () => {
              await handleSend('summarizeD')
              close()
            }}
          />
        </HStack>
      ) : null}
      <HStack justify="center">
        <Styled.CenterTextWrapper>
          <Icon
            source={SendIcon}
            color="txt-black-dark"
            size="xs"
          />
          <Text
            as="span"
            color="txt-black-dark"
          >
            {chatTitle}
          </Text>
        </Styled.CenterTextWrapper>
      </HStack>
    </VStack>
  )
}

export default Send
