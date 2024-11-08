import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import {
  VStack,
  HStack,
  Button,
  Text,
  Icon,
  RadioGroup,
  Radio,
  TextField,
  TextFieldRef,
} from '@channel.io/bezier-react'
import { CancelIcon, SendIcon } from '@channel.io/bezier-icons'
import { callFunction, getWamData, setSize } from '../../utils/wam'
import * as Styled from './Send.styled'
import { close } from '../../utils/wam'
enum Time {
  day1 = '1',
  day3 = '3',
  day5 = '5',
  day7 = '7',
}

function Send() {
  useEffect(() => {
    setSize(390, 322)
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

  const [inputNum, setinputNum] = useState<number>(1)
  const inputRef = useRef<TextFieldRef | null>(null)

  const [option, setOption] = useState<number>(0)
  const [selectedOption, setSelectedOption] = useState<Time | undefined>(
    Time.day1
  )
  const [hasError, setHasError] = useState<boolean>(false)

  const handleChangeValue = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (
        Number(event.currentTarget.value) < 1 ||
        Number(event.currentTarget.value) > 30
      ) {
        setHasError(true)
      } else {
        setHasError(false)
      }
      setinputNum(Number(event.currentTarget.value))
      event.preventDefault()
    },
    []
  )

  // const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
  //   setSelectedOption(e.target.value)
  // }

  const getTimeStamp = useCallback(() => {
    const millisecondsInADay = 24 * 60 * 60 * 1000 // 하루의 밀리초
    const endValue = Date.now()
    const startValue = endValue - millisecondsInADay * Number(selectedOption)

    return [startValue, endValue]
  }, [selectedOption])

  const handleOnClick = async () => {
    await handleSend('summarizeN')
    close()
  }

  const handleSend = useCallback(
    async (sender: string): Promise<void> => {
      if (chatType === 'group') {
        switch (sender) {
          case 'summarizeN':
            await callFunction(appId, 'getSummarize', {
              chat: {
                id: chatId,
                type: chatType,
              },
              input: {
                personId: managerId,
                flag: 0,
                mesgNum: inputNum,
              },
            })
            break
          case 'summarizeD':
            console.log(getTimeStamp()[0], getTimeStamp()[1])
            await callFunction(appId, 'getSummarize', {
              chat: {
                id: chatId,
                type: chatType,
              },
              input: {
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
      inputNum,
      rootMessageId,
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
        <VStack
          spacing={16}
          justify="center"
          align="center"
        >
          <Button
            size="l"
            colorVariant="blue"
            styleVariant="primary"
            text="최신 N개 메시지 요약"
            onClick={() => setOption(1)}
          />
          <Button
            size="l"
            colorVariant="blue"
            styleVariant="primary"
            text="시작 일시부터 지금까지 메시지 요약"
            onClick={() => setOption(2)}
          />
        </VStack>
      ) : option === 1 ? (
        <HStack spacing={16}>
          <TextField
            ref={inputRef}
            value={inputNum}
            allowClear
            autoFocus
            placeholder="숫자를 입력하세요"
            size="m"
            type="number"
            variant="primary"
            onChange={handleChangeValue}
            hasError={hasError}
          />
          <Button
            colorVariant="blue"
            styleVariant="primary"
            text="요약"
            type="submit"
            onClick={handleOnClick}
            disabled={hasError}
          />
        </HStack>
      ) : option === 2 ? (
        <VStack>
          <RadioGroup
            direction="vertical"
            onValueChange={setSelectedOption}
            spacing={0}
            value={selectedOption}
          >
            <Radio value={Time.day1}>24시간 전</Radio>
            <Radio value={Time.day3}>3일 전</Radio>
            <Radio value={Time.day5}>5일 전</Radio>
            <Radio value={Time.day7}>7일 전</Radio>
          </RadioGroup>
          <Styled.RightButtonWrapper>
            <Button
              colorVariant="blue"
              styleVariant="primary"
              text="요약"
              onClick={async () => {
                await handleSend('summarizeD')
                close()
              }}
            />
          </Styled.RightButtonWrapper>
        </VStack>
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
